import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { reverseQuerySchema, routeSchema, searchQuerySchema } from "../validators/maps.validator.js";
import { reverse as reverseService, search as searchService } from "../services/geocode.service.js";
import { getRoute } from "../services/routing.service.js";

export const search = async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const results = await searchService(parsed.data.q);
  res.status(200).json({
    success: true,
    message: "Locations retrieved successfully",
    data: { results },
  });
};

export const reverse = async (req: Request, res: Response) => {
  const parsed = reverseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const place = await reverseService(parsed.data.lat, parsed.data.lng);
  res.status(200).json({
    success: true,
    message: "Location retrieved successfully",
    data: { place },
  });
};

export const route = async (req: Request, res: Response) => {
  const parsed = routeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const result = await getRoute(parsed.data.pickup, parsed.data.drop);
  res.status(200).json({
    success: true,
    message: "Route calculated successfully",
    data: { route: result },
  });
};
