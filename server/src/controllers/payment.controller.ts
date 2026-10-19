import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  confirmPaymentSchema,
  createPaymentIntentSchema,
  ridePaymentParamsSchema,
} from "../validators/payment.validator.js";
import {
  confirmPayment as confirmPaymentService,
  createPaymentIntent as createPaymentIntentService,
  getRidePayment as getRidePaymentService,
  handleWebhook as handleWebhookService,
} from "../services/payment.service.js";

const requireRiderId = (req: Request): string => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user.id;
};

export const createIntent = async (req: Request, res: Response) => {
  const parsed = createPaymentIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const result = await createPaymentIntentService(
    parsed.data.rideId,
    requireRiderId(req),
    parsed.data.currency,
  );
  res.status(201).json({
    success: true,
    message: "Payment intent created",
    data: {
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      payment: result.payment,
    },
  });
};

export const confirm = async (req: Request, res: Response) => {
  const parsed = confirmPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const result = await confirmPaymentService(parsed.data.paymentIntentId, requireRiderId(req));
  res.status(200).json({
    success: true,
    message: "Payment confirmed",
    data: { payment: result },
  });
};

export const webhook = async (req: Request, res: Response) => {
  if (!Buffer.isBuffer(req.body)) {
    throw new AppError(400, "Invalid Stripe webhook payload");
  }

  const result = await handleWebhookService(req.body, req.header("stripe-signature"));
  res.status(200).json({
    success: true,
    message: "Webhook processed",
    data: result,
  });
};

export const getPayment = async (req: Request, res: Response) => {
  const parsed = ridePaymentParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid ride ID", parsed.error.flatten().fieldErrors);
  }

  const payment = await getRidePaymentService(parsed.data.rideId, requireRiderId(req));
  res.status(200).json({
    success: true,
    message: "Payment retrieved",
    data: { payment },
  });
};
