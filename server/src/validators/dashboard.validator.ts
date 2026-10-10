import { z } from "zod";

export const rejectLoanSchema = z.object({
  rejectionReason: z
    .string({ required_error: "Rejection reason is required" })
    .min(5, "Rejection reason must be at least 5 characters")
    .max(500, "Rejection reason must be under 500 characters")
    .trim(),
});

export const disburseLoanSchema = z.object({
  disbursementRef: z
    .string({ required_error: "Transaction reference is required" })
    .min(3, "Transaction reference must be at least 3 characters")
    .trim(),
  disbursementDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid disbursement date format",
    }),
});

export const recordRepaymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Payment amount must be a number" })
    .min(1, "Payment amount must be greater than zero"),
  utrNumber: z
    .string({ required_error: "UTR number is required" })
    .min(6, "UTR number must be at least 6 characters")
    .max(50, "UTR number cannot exceed 50 characters")
    .trim()
    .toUpperCase(),
  paymentDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid payment date format",
    }),
});
