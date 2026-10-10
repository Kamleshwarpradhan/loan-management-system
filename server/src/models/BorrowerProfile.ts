import mongoose, { Schema, Document } from "mongoose";
import { EmploymentMode, BREStatus } from "../types";

export interface IBorrowerProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  salary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  applicationStep: number;
  breStatus: BREStatus;
  breFailureReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const borrowerProfileSchema = new Schema<IBorrowerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    pan: {
      type: String,
      required: [true, "PAN is required"],
      uppercase: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    salary: {
      type: Number,
      required: [true, "Monthly salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
      required: [true, "Employment mode is required"],
    },
    salarySlipUrl: {
      type: String,
      default: null,
    },
    applicationStep: {
      type: Number,
      default: 2, // 1 = Auth done, 2 = Profile/BRE, 3 = Doc upload, 4 = Loan applied
    },
    breStatus: {
      type: String,
      enum: Object.values(BREStatus),
      default: BREStatus.PENDING,
    },
    breFailureReasons: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups (userId index is auto-created by unique: true)
borrowerProfileSchema.index({ breStatus: 1 });

export const BorrowerProfile = mongoose.model<IBorrowerProfileDocument>(
  "BorrowerProfile",
  borrowerProfileSchema
);
