import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required"),
});
