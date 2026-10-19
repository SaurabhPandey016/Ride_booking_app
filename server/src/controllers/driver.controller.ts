import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { driverStatusSchema, rideIdParamsSchema } from "../validators/ride.validator.js";
import {
  acceptRide as acceptRideService,
  declineRide as declineRideService,
  getDriverEarnings as getDriverEarningsService,
  getDriverRequests as getDriverRequestsService,
  setDriverStatus as setDriverStatusService,
} from "../services/ride.service.js";

const requireUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user.id;
};

const rideIdFromRequest = (req: Request): string => {
  const parsed = rideIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid ride ID", parsed.error.flatten().fieldErrors);
  }
  return parsed.data.id;
};

export const requests = async (req: Request, res: Response) => {
  const rides = await getDriverRequestsService(requireUserId(req));
  res.status(200).json({
    success: true,
    message: "Nearby ride requests retrieved",
    data: { rides },
  });
};

export const updateStatus = async (req: Request, res: Response) => {
  const parsed = driverStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const profile = await setDriverStatusService(
    requireUserId(req),
    parsed.data.isOnline,
    parsed.data.lat,
    parsed.data.lng,
  );
  res.status(200).json({
    success: true,
    message: `Driver is now ${profile.isOnline ? "online" : "offline"}`,
    data: { profile },
  });
};

export const acceptRide = async (req: Request, res: Response) => {
  const ride = await acceptRideService(rideIdFromRequest(req), requireUserId(req));
  res.status(200).json({ success: true, message: "Ride accepted", data: { ride } });
};

export const declineRide = async (req: Request, res: Response) => {
  await declineRideService(rideIdFromRequest(req), requireUserId(req));
  res.status(200).json({ success: true, message: "Ride declined" });
};

export const earnings = async (req: Request, res: Response) => {
  const totals = await getDriverEarningsService(requireUserId(req));
  res.status(200).json({
    success: true,
    message: "Driver earnings retrieved",
    data: { earnings: totals },
  });
};
