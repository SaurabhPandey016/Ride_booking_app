import { Router } from "express";
import { Role } from "@prisma/client";
import {
  earnings,
  requests,
  updateStatus,
} from "../controllers/driver.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const driverRouter = Router();

driverRouter.use(authenticate, authorize(Role.DRIVER));
driverRouter.get("/requests", asyncHandler(requests));
driverRouter.post("/status", asyncHandler(updateStatus));
driverRouter.get("/earnings", asyncHandler(earnings));
