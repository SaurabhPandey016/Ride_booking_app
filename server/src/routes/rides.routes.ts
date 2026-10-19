import { Router } from "express";
import { estimate } from "../controllers/rides.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const ridesRouter = Router();

ridesRouter.post("/estimate", authenticate, asyncHandler(estimate));
