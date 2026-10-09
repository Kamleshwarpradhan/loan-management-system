import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import borrowerRoutes from "./routes/borrower.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/borrower", borrowerRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "LMS API is running", timestamp: new Date().toISOString() });
});

// --------------- Global Error Handler ---------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --------------- Start Server ---------------
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 LMS Server running on http://localhost:${PORT}`);
  });
};

startServer();

export default app;
