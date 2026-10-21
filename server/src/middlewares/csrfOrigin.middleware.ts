import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const validateRequestOrigin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const origin = req.get("origin");
  if (
    stateChangingMethods.has(req.method) &&
    origin &&
    origin !== env.CLIENT_URL
  ) {
    res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
    return;
  }

  next();
};
