import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    const payload = verifyToken(token);

    void prisma.user
      .findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true },
      })
      .then((user) => {
        if (!user) {
          next(new AppError(401, "Authentication required"));
          return;
        }

        req.user = user;
        next();
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You are not authorized to access this resource"));
      return;
    }

    next();
  };
