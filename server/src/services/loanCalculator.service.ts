export interface LoanCalculationResult {
  principal: number;
  tenureDays: number;
  annualInterestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  dailyInterest: number;
}

/**
 * Annual Fixed Interest Rate: 12% p.a.
 */
export const ANNUAL_INTEREST_RATE = 12;

/**
 * Calculates Simple Interest using standard banking formula:
 * SI = (P * R * T) / (365 * 100)
 * Total Repayment = P + SI
 *
 * @param principal Loan Amount in ₹ (50,000 to 500,000)
 * @param tenureDays Tenure in days (30 to 365)
 * @param annualRate Annual interest rate in % (default: 12%)
 */
export const calculateLoan = (
  principal: number,
  tenureDays: number,
  annualRate: number = ANNUAL_INTEREST_RATE
): LoanCalculationResult => {
  // SI = (P * R * T) / (365 * 100)
  const exactSI = (principal * annualRate * tenureDays) / (365 * 100);
  const simpleInterest = Math.round(exactSI * 100) / 100;
  const totalRepayment = Math.round((principal + simpleInterest) * 100) / 100;
  const dailyInterest = Math.round((simpleInterest / tenureDays) * 100) / 100;

  return {
    principal,
    tenureDays,
    annualInterestRate: annualRate,
    simpleInterest,
    totalRepayment,
    dailyInterest,
  };
};
