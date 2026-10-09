import { Router } from "express";
import {
  getBorrowerProfile,
  saveProfileAndEvaluateBRE,
  uploadSalarySlipHandler,
} from "../controllers/borrower.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { uploadSalarySlip } from "../middleware/upload.middleware";
import { UserRole } from "../types";

const router = Router();

// Protect all routes: must be authenticated and have BORROWER or ADMIN role
router.use(verifyToken);
router.use(authorizeRoles(UserRole.BORROWER, UserRole.ADMIN));

router.get("/profile", getBorrowerProfile);
router.post("/profile", saveProfileAndEvaluateBRE);
router.post(
  "/upload-salary-slip",
  uploadSalarySlip.single("salarySlip"),
  uploadSalarySlipHandler
);

export default router;
