import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const health = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "RideX services are ready",
      data: {
        status: "ok",
        services: { api: "available", database: "available" },
      },
    });
  } catch (error: unknown) {
    console.error("RideX database readiness probe failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    res.status(503).json({
      success: false,
      message: "The database is starting or temporarily unavailable",
      data: {
        status: "degraded",
        services: { api: "available", database: "unavailable" },
      },
    });
  }
};
