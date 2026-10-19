import { VehicleType } from "@prisma/client";
import { z } from "zod";
import { routeSchema } from "./maps.validator.js";

export const estimateSchema = routeSchema;

export const createRideSchema = routeSchema.extend({
  vehicleType: z.nativeEnum(VehicleType),
});

export const rideIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cancelRideSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const driverStatusSchema = z
  .object({
    isOnline: z.boolean(),
    lat: z.coerce.number().finite().min(-90).max(90).optional(),
    lng: z.coerce.number().finite().min(-180).max(180).optional(),
  })
  .superRefine((data, context) => {
    if (data.isOnline && (data.lat === undefined || data.lng === undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current latitude and longitude are required to go online",
      });
    }
  });

export const driverLocationSocketSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  rideId: z.string().min(1).optional(),
});

export const rideRoomSocketSchema = z.object({
  rideId: z.string().min(1),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
