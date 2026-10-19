import { Role, VehicleType } from "@prisma/client";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const baseRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("A valid email is required").transform((email) => email.toLowerCase()),
  phone: z.string().trim().min(7, "A valid phone number is required").max(20),
  password: passwordSchema,
});

export const registerSchema = z.discriminatedUnion("role", [
  baseRegistrationSchema.extend({
    role: z.literal(Role.RIDER),
  }),
  baseRegistrationSchema.extend({
    role: z.literal(Role.DRIVER),
    vehicleType: z.nativeEnum(VehicleType),
    vehicleModel: z.string().trim().min(1, "Vehicle model is required"),
    vehicleNumber: z.string().trim().min(1, "Vehicle number is required"),
  }),
]);

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    vehicleType: z.nativeEnum(VehicleType).optional(),
    vehicleModel: z.string().trim().min(1).optional(),
    vehicleNumber: z.string().trim().min(1).optional(),
  })
  .refine((profile) => Object.keys(profile).length > 0, {
    message: "At least one profile field is required",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
