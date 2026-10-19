import { z } from "zod";
import { routeSchema } from "./maps.validator.js";

export const estimateSchema = routeSchema;

export type EstimateInput = z.infer<typeof estimateSchema>;
