import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError.js";
import {
  cancelRideSchema,
  createRideSchema,
  historyQuerySchema,
  rideIdParamsSchema,
} from "../validators/ride.validator.js";
import {
  cancelRide as cancelRideService,
  completeRide as completeRideService,
  createRide as createRideService,
  getActiveRide as getActiveRideService,
  getRideForParticipant,
  getRideHistory as getRideHistoryService,
  markRideArrived as markRideArrivedService,
  startRide as startRideService,
} from "../services/ride.service.js";

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user;
};

const parseRideId = (req: Request): string => {
  const parsed = rideIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid ride ID", parsed.error.flatten().fieldErrors);
  }

  return parsed.data.id;
};

export const createRide = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const parsed = createRideSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const ride = await createRideService(user.id, parsed.data);
  res.status(201).json({ success: true, message: "Ride requested successfully", data: { ride } });
};

export const getActiveRide = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ride = await getActiveRideService(user.id, user.role);
  res.status(200).json({ success: true, message: "Active ride retrieved", data: { ride } });
};

export const getRideHistory = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const history = await getRideHistoryService(user.id, user.role, parsed.data.page, parsed.data.limit);
  res.status(200).json({ success: true, message: "Ride history retrieved", data: history });
};

export const getRide = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ride = await getRideForParticipant(parseRideId(req), user.id);
  res.status(200).json({ success: true, message: "Ride retrieved", data: { ride } });
};

export const arrive = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ride = await markRideArrivedService(parseRideId(req), user.id);
  res.status(200).json({ success: true, message: "Driver arrived", data: { ride } });
};

export const start = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ride = await startRideService(parseRideId(req), user.id);
  res.status(200).json({ success: true, message: "Ride started", data: { ride } });
};

export const complete = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ride = await completeRideService(parseRideId(req), user.id);
  res.status(200).json({ success: true, message: "Ride completed", data: { ride } });
};

export const cancel = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const rideId = parseRideId(req);
  const parsed = cancelRideSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  if (user.role !== Role.RIDER && user.role !== Role.DRIVER) {
    throw new AppError(403, "Only ride participants can cancel a ride");
  }

  const ride = await cancelRideService(rideId, user.id, parsed.data.reason);
  res.status(200).json({ success: true, message: "Ride cancelled", data: { ride } });
};
