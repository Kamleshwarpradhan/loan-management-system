import mongoose, { Schema, Document } from "mongoose";

export interface IRepaymentDocument extends Document {
  loanId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  amount: number;
  utrNumber: string;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const repaymentSchema = new Schema<IRepaymentDocument>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be greater than zero"],
    },
    utrNumber: {
      type: String,
      required: [true, "UTR Number is required"],
      unique: true, // Must be strictly unique across all payments in the system
      trim: true,
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      default: Date.now,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on utrNumber is auto-created by unique: true
repaymentSchema.index({ loanId: 1, paymentDate: -1 });

export const Repayment = mongoose.model<IRepaymentDocument>(
  "Repayment",
  repaymentSchema
);
