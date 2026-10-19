import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  rideId: z.string().min(1),
  currency: z.enum(["INR", "USD"]),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().startsWith("pi_"),
});

export const ridePaymentParamsSchema = z.object({
  rideId: z.string().min(1),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
