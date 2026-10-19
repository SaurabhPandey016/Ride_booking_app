import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getRideReceipt } from "../services/receipt.service.js";
import { receiptParamsSchema } from "../validators/receipt.validator.js";

export const getReceipt = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  const parsed = receiptParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid ride ID", parsed.error.flatten().fieldErrors);
  }

  const receipt = await getRideReceipt(parsed.data.rideId, req.user.id);
  res.status(200).json({ success: true, message: "Receipt retrieved", data: { receipt } });
};
