// ============================================================
// Shared Type Definitions — LMS Client
// Mirrors server/src/types/index.ts for frontend usage.
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

export interface IUserPublic {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

// --------------- Borrower Profile ---------------

export interface IBorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dob: string;
  salary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  applicationStep: number;
  breStatus: BREStatus;
  breFailureReasons: string[];
  createdAt: string;
  updatedAt: string;
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
  sanctionedAt?: string;
  disbursedAt?: string;
  disbursementRef?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --------------- Repayment ---------------

export interface IRepayment {
  _id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  utrNumber: string;
  paymentDate: string;
  recordedBy: string;
  createdAt: string;
}

// --------------- API Response ---------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// --------------- Auth ---------------

export interface AuthResponse {
  token: string;
  user: IUserPublic;
}
