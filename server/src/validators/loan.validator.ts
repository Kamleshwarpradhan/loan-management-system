import { z } from "zod";

export const applyLoanSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Loan amount must be a number" })
    .min(50000, "Loan amount must be between ₹50,000 and ₹5,00,000")
    .max(500000, "Loan amount must be between ₹50,000 and ₹5,00,000"),
  tenureDays: z
    .number({ invalid_type_error: "Tenure must be a number" })
    .int("Tenure must be an integer number of days")
    .min(30, "Tenure must be between 30 and 365 days")
    .max(365, "Tenure must be between 30 and 365 days"),
});
