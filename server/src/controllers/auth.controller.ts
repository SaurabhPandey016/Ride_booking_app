import type { Request, Response } from "express";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { AppError } from "../utils/AppError.js";
import { login as loginService, register as registerService, getMe as getMeService, updateProfile as updateProfileService } from "../services/auth.service.js";
import { loginSchema, registerSchema, updateProfileSchema } from "../validators/auth.validator.js";

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const result = await registerService(parsed.data);
  setAuthCookie(res, result.token);
  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user: result.user },
  });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const result = await loginService(parsed.data);
  setAuthCookie(res, result.token);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: result.user },
  });
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  const user = await getMeService(req.user.id);
  res.status(200).json({
    success: true,
    message: "Authenticated user details",
    data: { user },
  });
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const user = await updateProfileService(req.user.id, parsed.data);
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
};
