import { Request, Response } from "express";
import { User } from "../models/User";
import { Loan } from "../models/Loan";
import { BorrowerProfile } from "../models/BorrowerProfile";
import { Repayment } from "../models/Repayment";
import { LoanStatus, UserRole } from "../types";
import {
  rejectLoanSchema,
  disburseLoanSchema,
  recordRepaymentSchema,
} from "../validators/dashboard.validator";

// =========================================================================
// 1. SALES MODULE: Pre-application lead tracking
// Borrowers who registered but haven't applied yet, or dropped off mid-way.
// =========================================================================

export const getSalesLeads = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find all borrowers
    const borrowers = await User.find({ role: UserRole.BORROWER })
      .select("-password")
      .sort({ createdAt: -1 });

    const borrowerIds = borrowers.map((b) => b._id);

    // Get profiles and existing applied loans
    const [profiles, loans] = await Promise.all([
      BorrowerProfile.find({ userId: { $in: borrowerIds } }),
      Loan.find({ borrowerId: { $in: borrowerIds } }),
    ]);

    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));
    const loanMap = new Map(loans.map((l) => [String(l.borrowerId), l]));

    // Lead = Any registered borrower who has NOT submitted an active loan application yet
    const leads = borrowers
      .filter((user) => {
        const loan = loanMap.get(String(user._id));
        return !loan; // Haven't applied yet
      })
      .map((user) => {
        const profile = profileMap.get(String(user._id));
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          registeredAt: user.createdAt,
          applicationStep: profile ? profile.applicationStep : 1,
          breStatus: profile ? profile.breStatus : "NOT_STARTED",
          salarySlipUploaded: Boolean(profile?.salarySlipUrl),
        };
      });

    res.status(200).json({
      success: true,
      data: { leads, count: leads.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sales leads",
    });
  }
};

// =========================================================================
// 2. SANCTION MODULE: Underwriting & Approvals
// Reviews APPLIED loans, checks borrower profile + salary slip, approves/rejects
// =========================================================================

export const getSanctionApplications = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const loans = await Loan.find({ status: LoanStatus.APPLIED })
      .populate("borrowerId", "name email phone")
      .sort({ createdAt: -1 });

    // Populate borrower profiles
    const borrowerIds = loans.map((l) => (l.borrowerId as any)._id);
    const profiles = await BorrowerProfile.find({ userId: { $in: borrowerIds } });
    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

    const applications = loans.map((loan) => {
      const borrowerUser = loan.borrowerId as any;
      const profile = profileMap.get(String(borrowerUser?._id));
      return {
        _id: loan._id,
        amount: loan.amount,
        tenureDays: loan.tenureDays,
        interestRate: loan.interestRate,
        interestAmount: loan.interestAmount,
        totalRepayment: loan.totalRepayment,
        status: loan.status,
        createdAt: loan.createdAt,
        borrower: {
          _id: borrowerUser?._id,
          name: borrowerUser?.name,
          email: borrowerUser?.email,
          phone: borrowerUser?.phone,
          pan: profile?.pan,
          dob: profile?.dob,
          salary: profile?.salary,
          employmentMode: profile?.employmentMode,
          salarySlipUrl: profile?.salarySlipUrl,
          breStatus: profile?.breStatus,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: { applications, count: applications.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sanction queue",
    });
  }
};

export const approveLoan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loanId } = req.params;
    const sanctionOfficerId = req.user!.userId;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan application not found" });
      return;
    }

    if (loan.status !== LoanStatus.APPLIED) {
      res.status(400).json({
        success: false,
        message: `Only loans in APPLIED status can be sanctioned. Current status: ${loan.status}`,
      });
      return;
    }

    loan.status = LoanStatus.SANCTIONED;
    loan.sanctionedBy = sanctionOfficerId as any;
    loan.sanctionedAt = new Date();
    await loan.save();

    res.status(200).json({
      success: true,
      message: "Loan sanctioned successfully! Moved to Disbursement queue.",
      data: { loan },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve loan",
    });
  }
};

export const rejectLoan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loanId } = req.params;
    const sanctionOfficerId = req.user!.userId;

    const validation = rejectLoanSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "A valid rejection reason is required",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { rejectionReason } = validation.data;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan application not found" });
      return;
    }

    if (loan.status !== LoanStatus.APPLIED) {
      res.status(400).json({
        success: false,
        message: `Only loans in APPLIED status can be rejected. Current status: ${loan.status}`,
      });
      return;
    }

    loan.status = LoanStatus.REJECTED;
    loan.rejectionReason = rejectionReason;
    loan.sanctionedBy = sanctionOfficerId as any;
    loan.sanctionedAt = new Date();
    await loan.save();

    res.status(200).json({
      success: true,
      message: "Loan application rejected with reason recorded.",
      data: { loan },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject loan",
    });
  }
};

// =========================================================================
// 3. DISBURSEMENT MODULE: Fund release
// Handles SANCTIONED loans -> Releases funds -> Moves status to DISBURSED
// =========================================================================

export const getSanctionedLoans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const loans = await Loan.find({ status: LoanStatus.SANCTIONED })
      .populate("borrowerId", "name email phone")
      .populate("sanctionedBy", "name email")
      .sort({ sanctionedAt: -1 });

    res.status(200).json({
      success: true,
      data: { loans, count: loans.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch disbursement queue",
    });
  }
};

export const disburseLoan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loanId } = req.params;
    const disbursementOfficerId = req.user!.userId;

    const validation = disburseLoanSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid disbursement details",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { disbursementRef, disbursementDate } = validation.data;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    if (loan.status !== LoanStatus.SANCTIONED) {
      res.status(400).json({
        success: false,
        message: `Only SANCTIONED loans can be disbursed. Current status: ${loan.status}`,
      });
      return;
    }

    loan.status = LoanStatus.DISBURSED;
    loan.disbursementRef = disbursementRef;
    loan.disbursedBy = disbursementOfficerId as any;
    loan.disbursedAt = disbursementDate ? new Date(disbursementDate) : new Date();
    await loan.save();

    res.status(200).json({
      success: true,
      message: "Funds marked as disbursed successfully! Loan is now active in Collection.",
      data: { loan },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to disburse loan",
    });
  }
};

// =========================================================================
// 4. COLLECTION MODULE: Payments, UTR unique logging & Auto-closure
// Records repayments against DISBURSED loans, tracks outstanding, auto-closes
// =========================================================================

export const getDisbursedLoans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const loans = await Loan.find({
      status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] },
    })
      .populate("borrowerId", "name email phone")
      .sort({ disbursedAt: -1 });

    res.status(200).json({
      success: true,
      data: { loans, count: loans.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch collection loans",
    });
  }
};

export const recordRepayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loanId } = req.params;
    const collectionExecutiveId = req.user!.userId;

    const validation = recordRepaymentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid payment details",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { amount, utrNumber, paymentDate } = validation.data;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    if (loan.status !== LoanStatus.DISBURSED) {
      res.status(400).json({
        success: false,
        message: `Payments can only be accepted for active DISBURSED loans. Current status: ${loan.status}`,
      });
      return;
    }

    // Validation: payment cannot exceed outstanding balance
    if (amount > loan.outstandingBalance) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds remaining outstanding balance (₹${loan.outstandingBalance}).`,
      });
      return;
    }

    // Check UTR uniqueness across all recorded payments in the entire database
    const existingPayment = await Repayment.findOne({ utrNumber });
    if (existingPayment) {
      res.status(409).json({
        success: false,
        message: `Duplicate UTR detected! UTR '${utrNumber}' has already been recorded in payment record ${existingPayment._id}.`,
      });
      return;
    }

    // Create payment entry
    const repayment = await Repayment.create({
      loanId: loan._id,
      borrowerId: loan.borrowerId,
      amount,
      utrNumber,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: collectionExecutiveId,
    });

    // Update loan balance
    loan.totalPaid = Math.round((loan.totalPaid + amount) * 100) / 100;
    loan.outstandingBalance = Math.round((loan.totalRepayment - loan.totalPaid) * 100) / 100;

    let autoClosed = false;
    // Auto-close loan if totalPaid equals or exceeds totalRepayment
    if (loan.totalPaid >= loan.totalRepayment) {
      loan.status = LoanStatus.CLOSED;
      loan.outstandingBalance = 0;
      loan.closedAt = new Date();
      autoClosed = true;
    }

    await loan.save();

    res.status(201).json({
      success: true,
      message: autoClosed
        ? `Payment recorded! Loan has been fully repaid and AUTO-CLOSED.`
        : `Payment recorded successfully! Remaining balance: ₹${loan.outstandingBalance.toLocaleString("en-IN")}.`,
      data: {
        repayment,
        loan: {
          _id: loan._id,
          totalPaid: loan.totalPaid,
          outstandingBalance: loan.outstandingBalance,
          status: loan.status,
          autoClosed,
        },
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "Duplicate UTR Number: This UTR has already been recorded.",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  }
};

export const getLoanPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Repayment.find({ loanId })
      .populate("recordedBy", "name email")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: { payments },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch loan repayments",
    });
  }
};

// =========================================================================
// 5. ADMIN MODULE: System-wide KPI metrics & Aggregates
// =========================================================================

export const getAdminMetrics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalBorrowers,
      appliedCount,
      sanctionedCount,
      disbursedCount,
      closedCount,
      rejectedCount,
      disbursedLoans,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.BORROWER }),
      Loan.countDocuments({ status: LoanStatus.APPLIED }),
      Loan.countDocuments({ status: LoanStatus.SANCTIONED }),
      Loan.countDocuments({ status: LoanStatus.DISBURSED }),
      Loan.countDocuments({ status: LoanStatus.CLOSED }),
      Loan.countDocuments({ status: LoanStatus.REJECTED }),
      Loan.find({ status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] } }),
    ]);

    const totalDisbursedAmount = disbursedLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalCollectedAmount = disbursedLoans.reduce((sum, l) => sum + l.totalPaid, 0);
    const totalOutstandingAmount = disbursedLoans.reduce(
      (sum, l) => sum + l.outstandingBalance,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalBorrowers,
        counts: {
          applied: appliedCount,
          sanctioned: sanctionedCount,
          disbursed: disbursedCount,
          closed: closedCount,
          rejected: rejectedCount,
        },
        financials: {
          totalDisbursedAmount,
          totalCollectedAmount,
          totalOutstandingAmount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin metrics",
    });
  }
};
