import { Router } from "express";
import { Role } from "@prisma/client";
import {
  arrive,
  cancel,
  complete,
  createRide,
  getActiveRide,
  getRide,
  getRideHistory,
  start,
} from "../controllers/ride.controller.js";
import { acceptRide, declineRide } from "../controllers/driver.controller.js";
import { estimate } from "../controllers/rides.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const ridesRouter = Router();

ridesRouter.use(authenticate);
ridesRouter.post("/estimate", asyncHandler(estimate));
ridesRouter.post("/", authorize(Role.RIDER), asyncHandler(createRide));
ridesRouter.get("/active", asyncHandler(getActiveRide));
ridesRouter.get("/history", asyncHandler(getRideHistory));
ridesRouter.get("/:id", asyncHandler(getRide));
ridesRouter.post("/:id/accept", authorize(Role.DRIVER), asyncHandler(acceptRide));
ridesRouter.post("/:id/decline", authorize(Role.DRIVER), asyncHandler(declineRide));
ridesRouter.post("/:id/arrived", authorize(Role.DRIVER), asyncHandler(arrive));
ridesRouter.post("/:id/start", authorize(Role.DRIVER), asyncHandler(start));
ridesRouter.post("/:id/complete", authorize(Role.DRIVER), asyncHandler(complete));
ridesRouter.post("/:id/cancel", asyncHandler(cancel));
