import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { UserRole } from "../types";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const JWT_SECRET = process.env.JWT_SECRET || "lms-default-secret-change-me";
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * POST /api/auth/register
 * Register a new borrower account.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { name, email, password, phone } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with Borrower role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: UserRole.BORROWER,
    });

    // Generate JWT
    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN_SECONDS };
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    // Generate JWT
    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN_SECONDS };
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched",
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};
