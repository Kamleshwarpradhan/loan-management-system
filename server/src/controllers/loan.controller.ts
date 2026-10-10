import { Request, Response } from "express";
import { Loan } from "../models/Loan";
import { BorrowerProfile } from "../models/BorrowerProfile";
import { calculateLoan } from "../services/loanCalculator.service";
import { applyLoanSchema } from "../validators/loan.validator";
import { BREStatus, LoanStatus } from "../types";

/**
 * POST /api/loans/apply
 * Validates prerequisite completion (BRE passed + salary slip uploaded),
 * calculates Simple Interest server-side, and creates a new loan with status APPLIED.
 */
export const applyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Validate request inputs
    const validation = applyLoanSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid loan parameters",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { amount, tenureDays } = validation.data;

    // Verify borrower profile prerequisites
    const profile = await BorrowerProfile.findOne({ userId });
    if (!profile) {
      res.status(400).json({
        success: false,
        message: "Borrower profile not found. Please complete personal details first.",
      });
      return;
    }

    if (profile.breStatus !== BREStatus.PASSED) {
      res.status(400).json({
        success: false,
        message: "Eligibility check (BRE) not passed. Application cannot be submitted.",
      });
      return;
    }

    if (!profile.salarySlipUrl) {
      res.status(400).json({
        success: false,
        message: "Salary slip is required before applying for a loan.",
      });
      return;
    }

    // Check if borrower already has an active or pending loan
    const existingActiveLoan = await Loan.findOne({
      borrowerId: userId,
      status: {
        $in: [LoanStatus.APPLIED, LoanStatus.SANCTIONED, LoanStatus.DISBURSED],
      },
    });

    if (existingActiveLoan) {
      res.status(400).json({
        success: false,
        message: `You already have a loan in progress (Status: ${existingActiveLoan.status}). Only one active loan is allowed at a time.`,
        data: { activeLoanId: existingActiveLoan._id },
      });
      return;
    }

    // Server-side Simple Interest calculation
    const calc = calculateLoan(amount, tenureDays);

    // Create loan
    const newLoan = await Loan.create({
      borrowerId: userId,
      amount: calc.principal,
      tenureDays: calc.tenureDays,
      interestRate: calc.annualInterestRate,
      interestAmount: calc.simpleInterest,
      totalRepayment: calc.totalRepayment,
      totalPaid: 0,
      outstandingBalance: calc.totalRepayment,
      status: LoanStatus.APPLIED,
    });

    res.status(201).json({
      success: true,
      message: "Loan application submitted successfully! It is now under review by our Sanction team.",
      data: {
        loan: newLoan,
        calculation: calc,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit loan application",
    });
  }
};

/**
 * GET /api/loans/my-loans
 * Returns all loans belonging to the authenticated borrower.
 */
export const getMyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const loans = await Loan.find({ borrowerId: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Borrower loans retrieved successfully",
      data: { loans },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve loans",
    });
  }
};

/**
 * GET /api/loans/calculate?amount=100000&tenureDays=180
 * Public/Borrower calculator helper endpoint for verification.
 */
export const calculateQuote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const amount = Number(req.query.amount || 100000);
    const tenureDays = Number(req.query.tenureDays || 180);

    const calc = calculateLoan(amount, tenureDays);
    res.status(200).json({
      success: true,
      data: calc,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to calculate quote",
    });
  }
};
