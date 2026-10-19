import { z } from "zod";

const latitudeSchema = z.coerce.number().finite().min(-90).max(90);
const longitudeSchema = z.coerce.number().finite().min(-180).max(180);

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});

export const reverseQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

const coordinateSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

export const routeSchema = z.object({
  pickup: coordinateSchema,
  drop: coordinateSchema,
});

export type Coordinates = z.infer<typeof coordinateSchema>;
