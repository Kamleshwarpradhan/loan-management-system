import { Router } from "express";
import {
  applyLoan,
  getMyLoans,
  calculateQuote,
} from "../controllers/loan.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { UserRole } from "../types";

const router = Router();

// Public/general calculator quote endpoint
router.get("/calculate", calculateQuote);

// Protected routes for borrower
router.use(verifyToken);
router.use(authorizeRoles(UserRole.BORROWER, UserRole.ADMIN));

router.post("/apply", applyLoan);
router.get("/my-loans", getMyLoans);

export default router;
