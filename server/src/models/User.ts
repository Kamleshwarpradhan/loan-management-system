import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Phone must be a 10-digit number"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BORROWER,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups (email index is auto-created by unique: true)
userSchema.index({ role: 1 });

export const User = mongoose.model<IUserDocument>("User", userSchema);
