import { Router } from "express";
import { Role } from "@prisma/client";
import { confirm, createIntent, getPayment } from "../controllers/payment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate, authorize(Role.RIDER));
paymentsRouter.post("/intent", asyncHandler(createIntent));
paymentsRouter.post("/confirm", asyncHandler(confirm));
paymentsRouter.get("/:rideId", asyncHandler(getPayment));
