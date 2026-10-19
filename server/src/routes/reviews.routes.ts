import { Router } from "express";
import { Role } from "@prisma/client";
import {
  create,
  getForRide,
  listForDriver,
} from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reviewsRouter = Router();

reviewsRouter.use(authenticate);
reviewsRouter.post("/", authorize(Role.RIDER), asyncHandler(create));
reviewsRouter.get("/driver/:driverId", asyncHandler(listForDriver));
reviewsRouter.get("/ride/:rideId", asyncHandler(getForRide));
