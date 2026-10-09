// ============================================================
// Shared Type Definitions — LMS
// These types are the single source of truth for both
// the frontend and backend. Keep them in sync.
// ============================================================

// --------------- Enums ---------------

export enum UserRole {
  ADMIN = "Admin",
  SALES = "Sales",
  SANCTION = "Sanction",
  DISBURSEMENT = "Disbursement",
  COLLECTION = "Collection",
  BORROWER = "Borrower",
}

export enum LoanStatus {
  DRAFT = "DRAFT",
  APPLIED = "APPLIED",
  SANCTIONED = "SANCTIONED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
  CLOSED = "CLOSED",
}

export enum EmploymentMode {
  SALARIED = "Salaried",
  SELF_EMPLOYED = "Self-Employed",
  UNEMPLOYED = "Unemployed",
}

export enum BREStatus {
  PENDING = "PENDING",
  PASSED = "PASSED",
  FAILED = "FAILED",
}

// --------------- User ---------------

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
}

// --------------- Borrower Profile ---------------

export interface IBorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dob: Date;
  salary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  applicationStep: number; // 1–4
  breStatus: BREStatus;
  breFailureReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

// --------------- Loan ---------------

export interface ILoan {
  _id: string;
  borrowerId: string;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: string;
  sanctionedAt?: Date;
  disbursedBy?: string;
  disbursedAt?: Date;
  disbursementRef?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// --------------- Repayment ---------------

export interface IRepayment {
  _id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  utrNumber: string;
  paymentDate: Date;
  recordedBy: string;
  createdAt: Date;
}

// --------------- API Response ---------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// --------------- Auth ---------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: IUserPublic;
}

// --------------- JWT Payload ---------------

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
