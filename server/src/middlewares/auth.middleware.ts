import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    next(error);
  }
};
