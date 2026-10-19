import { z } from "zod";

export const receiptParamsSchema = z.object({
  rideId: z.string().min(1),
});
