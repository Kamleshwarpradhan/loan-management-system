import { Router } from "express";
import {
  getSalesLeads,
  getSanctionApplications,
  approveLoan,
  rejectLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordRepayment,
  getLoanPayments,
  getAdminMetrics,
} from "../controllers/dashboard.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { UserRole } from "../types";

const router = Router();

// All dashboard endpoints require authentication
router.use(verifyToken);

// 1. Sales module (Sales & Admin)
router.get("/sales/leads", authorizeRoles(UserRole.SALES, UserRole.ADMIN), getSalesLeads);

// 2. Sanction module (Sanction & Admin)
router.get(
  "/sanction/applications",
  authorizeRoles(UserRole.SANCTION, UserRole.ADMIN),
  getSanctionApplications
);
router.put(
  "/sanction/:loanId/approve",
  authorizeRoles(UserRole.SANCTION, UserRole.ADMIN),
  approveLoan
);
router.put(
  "/sanction/:loanId/reject",
  authorizeRoles(UserRole.SANCTION, UserRole.ADMIN),
  rejectLoan
);

// 3. Disbursement module (Disbursement & Admin)
router.get(
  "/disbursement/sanctioned",
  authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  getSanctionedLoans
);
router.put(
  "/disbursement/:loanId/disburse",
  authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  disburseLoan
);

// 4. Collection module (Collection & Admin)
router.get(
  "/collection/loans",
  authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN),
  getDisbursedLoans
);
router.post(
  "/collection/:loanId/payment",
  authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN),
  recordRepayment
);
router.get(
  "/collection/:loanId/payments",
  authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN),
  getLoanPayments
);

// 5. Admin KPIs overview (Admin only)
router.get("/admin/metrics", authorizeRoles(UserRole.ADMIN), getAdminMetrics);

export default router;
