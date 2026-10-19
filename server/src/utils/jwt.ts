import { Role } from "@prisma/client";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export type AuthTokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export const signToken = (user: AuthTokenPayload): string =>
  jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d",
  });

const isRole = (value: unknown): value is Role => value === Role.RIDER || value === Role.DRIVER;

const isAuthTokenPayload = (
  value: string | JwtPayload,
): value is JwtPayload & { sub: string; email: string; role: Role } =>
  typeof value !== "string" &&
  typeof value.sub === "string" &&
  typeof value.email === "string" &&
  isRole(value.role);

export const verifyToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!isAuthTokenPayload(decoded)) {
      throw new AppError(401, "Authentication required");
    }

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Authentication required");
    }

    throw error;
  }
};
