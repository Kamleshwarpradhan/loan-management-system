import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models/User";
import { UserRole } from "../types";

dotenv.config();

const SEED_PASSWORD = "password123";

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@lms.com",
    phone: "9000000001",
    role: UserRole.ADMIN,
  },
  {
    name: "Sales Executive",
    email: "sales@lms.com",
    phone: "9000000002",
    role: UserRole.SALES,
  },
  {
    name: "Sanction Officer",
    email: "sanction@lms.com",
    phone: "9000000003",
    role: UserRole.SANCTION,
  },
  {
    name: "Disbursement Officer",
    email: "disbursement@lms.com",
    phone: "9000000004",
    role: UserRole.DISBURSEMENT,
  },
  {
    name: "Collection Executive",
    email: "collection@lms.com",
    phone: "9000000005",
    role: UserRole.COLLECTION,
  },
  {
    name: "Test Borrower",
    email: "borrower@lms.com",
    phone: "9000000006",
    role: UserRole.BORROWER,
  },
];

const seed = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/lms";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB for seeding");

    // Clear existing users
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users");

    // Hash the common password once
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

    // Create seed users
    const usersToCreate = seedUsers.map((user) => ({
      ...user,
      password: hashedPassword,
    }));

    await User.insertMany(usersToCreate);
    console.log(`🌱 Seeded ${usersToCreate.length} users successfully`);

    console.log("\n📋 Test Credentials:");
    console.log("─".repeat(45));
    seedUsers.forEach((user) => {
      console.log(`  ${user.role.padEnd(15)} → ${user.email} / ${SEED_PASSWORD}`);
    });
    console.log("─".repeat(45));

    await mongoose.disconnect();
    console.log("\n✅ Seeding complete. Database disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
