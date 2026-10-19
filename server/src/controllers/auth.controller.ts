import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { loginUser, registerUser } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuthResponse = (res: Response, token: string, message: string, user: unknown) => {
  res.cookie('token', token, cookieOptions);
  res.status(200).json({
    success: true,
    message,
    data: { user },
  });
};

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const { name, email, password } = parsed.data;
  const result = await registerUser(name, email, password);
  sendAuthResponse(res, result.token, 'Registration successful', result.user);
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const { email, password } = parsed.data;
  const result = await loginUser(email, password);
  sendAuthResponse(res, result.token, 'Login successful', result.user);
};

export const me = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated user details',
    data: { user: null },
  });
};
