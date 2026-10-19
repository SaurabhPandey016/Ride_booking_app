import { z } from "zod";

export const createReviewSchema = z.object({
  rideId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export const driverReviewsParamsSchema = z.object({
  driverId: z.string().min(1),
});

export const rideReviewParamsSchema = z.object({
  rideId: z.string().min(1),
});

export const reviewPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
