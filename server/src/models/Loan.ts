import mongoose, { Schema, Document } from "mongoose";
import { LoanStatus } from "../types";

export interface ILoanDocument extends Document {
  borrowerId: mongoose.Types.ObjectId;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  disbursementRef?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoanDocument>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [50000, "Minimum loan amount is ₹50,000"],
      max: [500000, "Maximum loan amount is ₹5,00,000"],
    },
    tenureDays: {
      type: Number,
      required: [true, "Tenure in days is required"],
      min: [30, "Minimum tenure is 30 days"],
      max: [365, "Maximum tenure is 365 days"],
    },
    interestRate: {
      type: Number,
      required: true,
      default: 12, // Fixed at 12% p.a.
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRepayment: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.APPLIED,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    sanctionedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sanctionedAt: {
      type: Date,
      default: null,
    },
    disbursedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    disbursedAt: {
      type: Date,
      default: null,
    },
    disbursementRef: {
      type: String,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
loanSchema.index({ borrowerId: 1, status: 1 });
loanSchema.index({ createdAt: -1 });

export const Loan = mongoose.model<ILoanDocument>("Loan", loanSchema);
