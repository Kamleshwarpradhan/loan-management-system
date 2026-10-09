import { EmploymentMode, BREStatus } from "../types";

export interface BREResult {
  passed: boolean;
  status: BREStatus;
  failures: string[];
  ageCalculated: number;
}

export interface BREInput {
  dob: Date | string;
  salary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

/**
 * Valid Indian PAN format regex:
 * - 5 uppercase letters
 * - 4 digits
 * - 1 uppercase letter
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Calculates accurate age from Date of Birth.
 */
export const calculateAge = (dob: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Business Rule Engine (BRE)
 * Evaluates core eligibility criteria:
 * 1. Age: Must be between 23 and 50 (inclusive).
 * 2. Salary: Must be at least ₹25,000 per month.
 * 3. PAN: Must match valid 10-character PAN format.
 * 4. Employment: Must NOT be "Unemployed".
 */
export const evaluateBRE = (input: BREInput): BREResult => {
  const failures: string[] = [];
  const dobDate = typeof input.dob === "string" ? new Date(input.dob) : input.dob;
  const age = calculateAge(dobDate);

  // Rule 1: Age check (23 - 50)
  if (age < 23 || age > 50) {
    failures.push(
      `Age must be between 23 and 50 years. Current calculated age: ${age} years.`
    );
  }

  // Rule 2: Salary check (>= 25,000)
  if (input.salary < 25000) {
    failures.push(
      `Monthly salary must be at least ₹25,000. Provided salary: ₹${input.salary.toLocaleString("en-IN")}.`
    );
  }

  // Rule 3: PAN format check
  const upperPAN = (input.pan || "").trim().toUpperCase();
  if (!PAN_REGEX.test(upperPAN)) {
    failures.push(
      `PAN does not match valid format (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F). Provided: ${upperPAN}`
    );
  }

  // Rule 4: Employment mode check
  if (input.employmentMode === EmploymentMode.UNEMPLOYED) {
    failures.push("Applicant cannot be Unemployed. Must be Salaried or Self-Employed.");
  }

  const passed = failures.length === 0;

  return {
    passed,
    status: passed ? BREStatus.PASSED : BREStatus.FAILED,
    failures,
    ageCalculated: age,
  };
};
