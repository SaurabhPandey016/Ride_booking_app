import { randomInt } from "node:crypto";
import { PaymentStatus, Prisma, RideStatus } from "@prisma/client";
import type Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { stripe } from "../config/stripe.js";
import { AppError } from "../utils/AppError.js";
import type { CreatePaymentIntentInput } from "../validators/payment.validator.js";

const paymentWithRideSelect = {
  id: true,
  rideId: true,
  stripePaymentIntentId: true,
  amountMinor: true,
  currency: true,
  status: true,
  receiptNumber: true,
  createdAt: true,
  paidAt: true,
  ride: {
    select: {
      riderId: true,
      driverId: true,
      status: true,
      farePaise: true,
    },
  },
} satisfies Prisma.PaymentSelect;

const createReceiptNumber = (): string => {
  const date = new Date();
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");

  return `RX-${datePart}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
};

const amountForCurrency = (farePaise: number, currency: "INR" | "USD"): number => {
  if (currency === "INR") {
    return farePaise;
  }

  if (!Number.isFinite(env.USD_INR_RATE) || env.USD_INR_RATE <= 0) {
    throw new AppError(500, "USD_INR_RATE must be configured as a positive number");
  }

  return Math.max(50, Math.round(farePaise / env.USD_INR_RATE));
};

const getClientSecret = (intent: Stripe.PaymentIntent): string => {
  if (!intent.client_secret) {
    throw new AppError(502, "Payment provider did not return a client secret");
  }

  return intent.client_secret;
};

export const createPaymentIntent = async (
  rideId: string,
  riderId: string,
  currency: "INR" | "USD",
) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: {
      id: true,
      riderId: true,
      driverId: true,
      status: true,
      farePaise: true,
      payment: { select: paymentWithRideSelect },
    },
  });

  if (!ride || ride.riderId !== riderId) {
    throw new AppError(404, "Completed ride not found");
  }
  if (ride.status !== RideStatus.COMPLETED || !ride.driverId) {
    throw new AppError(409, "Payment is available only for completed rides");
  }

  const existingPayment = ride.payment;
  if (existingPayment?.status === PaymentStatus.SUCCEEDED) {
    throw new AppError(409, "This ride has already been paid");
  }
  if (existingPayment?.status === PaymentStatus.PENDING) {
    if (existingPayment.currency !== currency) {
      throw new AppError(409, "A payment is already pending in another currency");
    }

    const existingIntent = await stripe.paymentIntents.retrieve(
      existingPayment.stripePaymentIntentId,
    );
    return {
      paymentIntentId: existingIntent.id,
      clientSecret: getClientSecret(existingIntent),
      payment: existingPayment,
    };
  }

  const amountMinor = amountForCurrency(ride.farePaise, currency);
  const retryDiscriminator = existingPayment?.stripePaymentIntentId ?? "initial";
  const idempotencyKey = `ride-payment-${rideId}-${currency}-${retryDiscriminator}`;
  const intent = await stripe.paymentIntents.create(
    {
      amount: amountMinor,
      currency: currency.toLowerCase(),
      metadata: { rideId, riderId },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    },
    { idempotencyKey },
  );

  const payment = await prisma.payment.upsert({
    where: { rideId },
    create: {
      rideId,
      stripePaymentIntentId: intent.id,
      amountMinor,
      currency,
      status: PaymentStatus.PENDING,
      receiptNumber: createReceiptNumber(),
    },
    update: {
      stripePaymentIntentId: intent.id,
      amountMinor,
      currency,
      status: PaymentStatus.PENDING,
      receiptNumber: createReceiptNumber(),
      paidAt: null,
    },
    select: paymentWithRideSelect,
  });

  return { paymentIntentId: intent.id, clientSecret: getClientSecret(intent), payment };
};

const applyPaymentSucceeded = async (intent: Stripe.PaymentIntent): Promise<boolean> => {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intent.id },
    select: {
      id: true,
      amountMinor: true,
      currency: true,
      status: true,
      ride: { select: { driverId: true, farePaise: true, status: true } },
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment record not found");
  }
  if (
    payment.amountMinor !== intent.amount ||
    payment.currency.toLowerCase() !== intent.currency.toLowerCase()
  ) {
    throw new AppError(400, "Payment amount or currency does not match the payment record");
  }
  if (payment.ride.status !== RideStatus.COMPLETED || !payment.ride.driverId) {
    throw new AppError(409, "Ride is not eligible for payment settlement");
  }

  const driverId = payment.ride.driverId;
  return prisma.$transaction(async (transaction) => {
    const update = await transaction.payment.updateMany({
      where: { id: payment.id, status: { not: PaymentStatus.SUCCEEDED } },
      data: { status: PaymentStatus.SUCCEEDED, paidAt: new Date() },
    });

    if (update.count === 0) {
      return false;
    }

    const driverPayoutPaise = Math.floor((payment.ride.farePaise * 85) / 100);
    await transaction.driverProfile.update({
      where: { userId: driverId },
      data: { totalEarningsPaise: { increment: driverPayoutPaise } },
    });

    return true;
  });
};

const applyPaymentFailed = async (intent: Stripe.PaymentIntent): Promise<void> => {
  await prisma.payment.updateMany({
    where: {
      stripePaymentIntentId: intent.id,
      status: PaymentStatus.PENDING,
    },
    data: { status: PaymentStatus.FAILED },
  });
};

export const confirmPayment = async (paymentIntentId: string, riderId: string) => {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { ride: { select: { riderId: true } } },
  });
  if (!payment || payment.ride.riderId !== riderId) {
    throw new AppError(404, "Payment not found");
  }

  if (intent.status !== "succeeded") {
    throw new AppError(409, "Payment has not succeeded");
  }

  const credited = await applyPaymentSucceeded(intent);
  return { status: PaymentStatus.SUCCEEDED, credited };
};

export const handleWebhook = async (
  rawBody: Buffer,
  signature: string | undefined,
): Promise<{ received: true; eventType: string }> => {
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(400, "Missing Stripe webhook signature configuration");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError(400, "Invalid Stripe webhook signature");
  }

  if (event.type === "payment_intent.succeeded") {
    await applyPaymentSucceeded(event.data.object);
  } else if (event.type === "payment_intent.payment_failed") {
    await applyPaymentFailed(event.data.object);
  }

  return { received: true, eventType: event.type };
};

export const getRidePayment = async (rideId: string, riderId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      rideId,
      ride: { riderId },
    },
    select: {
      id: true,
      rideId: true,
      amountMinor: true,
      currency: true,
      status: true,
      receiptNumber: true,
      createdAt: true,
      paidAt: true,
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  return payment;
};
