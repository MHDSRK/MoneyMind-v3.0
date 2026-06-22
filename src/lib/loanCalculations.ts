import { Loan } from "@/hooks/useStore";
import { addMonths, differenceInMonths } from "date-fns";

/**
 * Calculate remaining EMIs for a loan
 */
export function getRemainingEmis(loan: Loan): number {
  return Math.max(0, loan.emiCount - loan.paidCount);
}

/**
 * Calculate total amount paid so far
 */
export function getTotalAmountPaid(loan: Loan): number {
  return loan.paidCount * loan.emiAmount;
}

/**
 * Calculate total interest paid so far
 */
export function getTotalInterestPaid(loan: Loan): number {
  return getTotalAmountPaid(loan) - (loan.principal - loan.outstanding);
}

/**
 * Calculate next EMI date
 */
export function getNextEmiDate(loan: Loan): Date {
  if (loan.nextEmiDate) {
    return new Date(loan.nextEmiDate);
  }
  const startDate = new Date(loan.startDate);
  const freq = loan.emiFrequency === "monthly" ? 1 : 3;
  return addMonths(startDate, loan.paidCount * freq + freq);
}

/**
 * Calculate loan end date
 */
export function getLoanEndDate(loan: Loan): Date {
  const startDate = new Date(loan.startDate);
  const freq = loan.emiFrequency === "monthly" ? 1 : 3;
  return addMonths(startDate, loan.emiCount * freq);
}

/**
 * Get months remaining until loan is paid off
 */
export function getMonthsRemaining(loan: Loan): number {
  const now = new Date();
  const endDate = getLoanEndDate(loan);
  return Math.max(0, differenceInMonths(endDate, now));
}

/**
 * Calculate total interest for the loan
 */
export function calculateTotalInterest(principal: number, interestRate: number, months: number): number {
  // Simple interest formula for EMI
  const monthlyRate = interestRate / 12 / 100;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const emi = numerator / denominator;
  return (emi * months) - principal;
}

/**
 * Calculate EMI given principal, interest rate, and tenure in months
 */
export function calculateEmi(principal: number, annualRate: number, months: number): number {
  if (months === 0 || principal === 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / months;
  }
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return numerator / denominator;
}

/**
 * Get loan payment schedule
 */
export function getLoanPaymentSchedule(
  loan: Loan
): Array<{
  month: number;
  date: Date;
  principal: number;
  interest: number;
  emi: number;
  balance: number;
}> {
  const schedule = [];
  const monthlyRate = loan.interestRate / 12 / 100;
  let balance = loan.principal;

  for (let i = 1; i <= loan.emiCount; i++) {
    const interest = balance * monthlyRate;
    const principal = loan.emiAmount - interest;
    balance -= principal;

    const date = new Date(loan.startDate);
    const freq = loan.emiFrequency === "monthly" ? 1 : 3;
    date.setMonth(date.getMonth() + i * freq);

    schedule.push({
      month: i,
      date,
      principal: Math.max(0, principal),
      interest: Math.max(0, interest),
      emi: loan.emiAmount,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
}

/**
 * Check if loan is in default (missed EMI)
 */
export function isLoanInDefault(loan: Loan): boolean {
  if (!loan.nextEmiDate) return false;
  const now = new Date();
  const nextDue = new Date(loan.nextEmiDate);
  return now > nextDue;
}
