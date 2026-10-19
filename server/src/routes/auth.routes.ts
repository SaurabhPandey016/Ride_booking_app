import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, me, register, updateMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/authRateLimiter.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(register));
authRouter.post("/login", authRateLimiter, asyncHandler(login));
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, asyncHandler(me));
authRouter.patch("/me", authenticate, asyncHandler(updateMe));
