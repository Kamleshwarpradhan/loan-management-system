import { Request, Response } from "express";
import { BorrowerProfile } from "../models/BorrowerProfile";
import { evaluateBRE } from "../services/bre.service";
import { borrowerProfileSchema } from "../validators/borrower.validator";
import { BREStatus } from "../types";

/**
 * GET /api/borrower/profile
 * Returns the current authenticated borrower's profile and progress step.
 */
export const getBorrowerProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await BorrowerProfile.findOne({ userId });

    res.status(200).json({
      success: true,
      message: profile ? "Profile fetched" : "No profile started yet",
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

/**
 * POST /api/borrower/profile
 * Saves personal details, executes the Business Rule Engine (BRE),
 * and records eligibility result.
 */
export const saveProfileAndEvaluateBRE = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Validate inputs
    const validation = borrowerProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid inputs provided",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { fullName, pan, dob, salary, employmentMode } = validation.data;

    // Run Server-side Business Rule Engine (BRE)
    const breResult = evaluateBRE({
      dob,
      salary,
      pan,
      employmentMode,
    });

    // Determine current progression step:
    // If BRE fails, remain on step 2 with failure reasons
    // If BRE passes, advance to step 3 (Document Upload)
    const nextStep = breResult.passed ? 3 : 2;

    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        fullName,
        pan,
        dob: new Date(dob),
        salary,
        employmentMode,
        breStatus: breResult.status,
        breFailureReasons: breResult.failures,
        applicationStep: nextStep,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: breResult.passed
        ? "Eligibility check passed! Proceed to document upload."
        : "Application blocked: Eligibility criteria not met.",
      data: {
        profile,
        breResult,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to evaluate profile",
    });
  }
};

/**
 * POST /api/borrower/upload-salary-slip
 * Handles salary slip file upload and advances progress to step 4.
 */
export const uploadSalarySlipHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No salary slip file uploaded. Please attach a PDF, JPG, or PNG file.",
      });
      return;
    }

    // Ensure borrower passed BRE before allowing upload
    const profile = await BorrowerProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Borrower profile not found. Please complete personal details first.",
      });
      return;
    }

    if (profile.breStatus !== BREStatus.PASSED) {
      res.status(400).json({
        success: false,
        message: "Cannot upload salary slip until BRE eligibility criteria have passed.",
      });
      return;
    }

    // Relative URL for accessing the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    profile.salarySlipUrl = fileUrl;
    profile.applicationStep = 4; // Advance to Loan Config & Apply
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Salary slip uploaded and verified successfully!",
      data: {
        salarySlipUrl: fileUrl,
        applicationStep: profile.applicationStep,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
};
