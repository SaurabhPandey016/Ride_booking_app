import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  createReview,
  getDriverReviews,
  getRideReview,
} from "../services/review.service.js";
import {
  createReviewSchema,
  driverReviewsParamsSchema,
  reviewPaginationSchema,
  rideReviewParamsSchema,
} from "../validators/review.validator.js";

const requireUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user.id;
};

export const create = async (req: Request, res: Response) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const review = await createReview(
    requireUserId(req),
    parsed.data.rideId,
    parsed.data.rating,
    parsed.data.comment,
  );
  res.status(201).json({ success: true, message: "Review created", data: { review } });
};

export const listForDriver = async (req: Request, res: Response) => {
  const params = driverReviewsParamsSchema.safeParse(req.params);
  const query = reviewPaginationSchema.safeParse(req.query);
  if (!params.success || !query.success) {
    throw new AppError(400, "Validation failed", {
      ...(!params.success ? params.error.flatten().fieldErrors : {}),
      ...(!query.success ? query.error.flatten().fieldErrors : {}),
    });
  }

  const result = await getDriverReviews(
    params.data.driverId,
    query.data.page,
    query.data.limit,
  );
  res.status(200).json({ success: true, message: "Driver reviews retrieved", data: result });
};

export const getForRide = async (req: Request, res: Response) => {
  const parsed = rideReviewParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid ride ID", parsed.error.flatten().fieldErrors);
  }

  const review = await getRideReview(parsed.data.rideId, requireUserId(req));
  res.status(200).json({ success: true, message: "Ride review retrieved", data: { review } });
};
