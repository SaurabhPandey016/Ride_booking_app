import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { calculateAllFares } from "../services/fare.service.js";
import { getRoute } from "../services/routing.service.js";
import { estimateSchema } from "../validators/ride.validator.js";

export const estimate = async (req: Request, res: Response) => {
  const parsed = estimateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const route = await getRoute(parsed.data.pickup, parsed.data.drop);
  const fares = calculateAllFares(route.distanceKm, route.durationMin);

  res.status(200).json({
    success: true,
    message: "Ride estimate calculated successfully",
    data: { route, fares },
  });
};
