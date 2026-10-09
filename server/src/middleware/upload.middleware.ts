import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const userId = req.user?.userId || "unknown";
    const timestamp = Date.now();
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `salary_slip_${userId}_${timestamp}${cleanExt}`);
  },
});

// Allowed file types: PDF, JPG, JPEG, PNG
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file format. Only PDF, JPG, and PNG documents are allowed."
      )
    );
  }
};

// Max 5 MB limit
export const uploadSalarySlip = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});
