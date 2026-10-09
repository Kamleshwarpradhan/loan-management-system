import { z } from "zod";
import { EmploymentMode } from "../types";
import { PAN_REGEX } from "../services/bre.service";

export const borrowerProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .trim(),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, "PAN must follow valid format (5 uppercase letters, 4 digits, 1 uppercase letter)"),
  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid Date of Birth",
    }),
  salary: z
    .number({ invalid_type_error: "Salary must be a valid number" })
    .min(0, "Salary cannot be negative"),
  employmentMode: z.nativeEnum(EmploymentMode, {
    errorMap: () => ({ message: "Employment mode must be Salaried, Self-Employed, or Unemployed" }),
  }),
});
