import { Router } from "express";
import { getReceipt } from "../controllers/receipt.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const receiptsRouter = Router();

receiptsRouter.use(authenticate);
receiptsRouter.get("/:rideId", asyncHandler(getReceipt));
