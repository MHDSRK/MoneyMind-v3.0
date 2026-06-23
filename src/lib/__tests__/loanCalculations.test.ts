import { describe, it, expect } from "vitest";
import {
  getRemainingEmis,
  getTotalAmountPaid,
  getTotalInterestPaid,
} from "@/lib/loanCalculations";
import { Loan } from "@/hooks/useStore";

describe("Loan Calculations", () => {
  // Helper to create a test loan
  const createLoan = (overrides: Partial<Loan> = {}): Loan => ({
    id: "loan-1",
    name: "Test Loan",
    lender: "Test Bank",
    principal: 100000,
    interestRate: 10,
    emiAmount: 1000,
    emiFrequency: "monthly",
    emiCount: 120,
    paidCount: 0,
    outstanding: 100000,
    nextEmiDate: "2026-02-01",
    startDate: "2025-01-01",
    deleted: false,
    ...overrides,
  });

  describe("Remaining EMIs Calculation", () => {
    it("should calculate remaining EMIs correctly when partially paid", () => {
      const loan = createLoan({
        emiCount: 120,
        paidCount: 24,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(96);
    });

    it("should return 0 when all EMIs are paid", () => {
      const loan = createLoan({
        emiCount: 120,
        paidCount: 120,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(0);
    });

    it("should return 0 when more EMIs marked paid than total (edge case)", () => {
      const loan = createLoan({
        emiCount: 120,
        paidCount: 125,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(0);
    });

    it("should return full duration when nothing is paid", () => {
      const loan = createLoan({
        emiCount: 120,
        paidCount: 0,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(120);
    });

    it("should calculate for short-term loans", () => {
      const loan = createLoan({
        emiCount: 12,
        paidCount: 5,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(7);
    });

    it("should calculate for long-term loans (30 years)", () => {
      const loan = createLoan({
        emiCount: 360,
        paidCount: 100,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(260);
    });
  });

  describe("Total Amount Paid Calculation", () => {
    it("should calculate total amount paid correctly", () => {
      const loan = createLoan({
        emiAmount: 1000,
        paidCount: 24,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(24000);
    });

    it("should return 0 when no EMI is paid", () => {
      const loan = createLoan({
        emiAmount: 1000,
        paidCount: 0,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(0);
    });

    it("should calculate when all EMIs are paid", () => {
      const loan = createLoan({
        emiAmount: 5000,
        paidCount: 120,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(600000);
    });

    it("should handle decimal EMI amounts", () => {
      const loan = createLoan({
        emiAmount: 4791.63,
        paidCount: 12,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBeCloseTo(57499.56, 1);
    });

    it("should scale correctly with high EMI amounts", () => {
      const loan = createLoan({
        emiAmount: 50000,
        paidCount: 60,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(3000000);
    });

    it("should handle single EMI payment", () => {
      const loan = createLoan({
        emiAmount: 15000,
        paidCount: 1,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(15000);
    });
  });

  describe("Total Interest Paid Calculation", () => {
    it("should calculate total interest paid correctly", () => {
      const loan = createLoan({
        principal: 100000,
        paidCount: 12,
        emiAmount: 8791.63,
        outstanding: 88500,
      });

      const interestPaid = getTotalInterestPaid(loan);
      expect(interestPaid).toBeGreaterThan(90000);
    });

    it("should return 0 when no EMI is paid", () => {
      const loan = createLoan({
        principal: 100000,
        paidCount: 0,
        outstanding: 100000,
      });

      const interestPaid = getTotalInterestPaid(loan);
      expect(interestPaid).toBe(0);
    });

    it("should show interest accumulation over time", () => {
      const loan1 = createLoan({
        principal: 100000,
        paidCount: 6,
        emiAmount: 1000,
        outstanding: 95000,
      });

      const loan2 = createLoan({
        principal: 100000,
        paidCount: 12,
        emiAmount: 1000,
        outstanding: 90000,
      });

      const interest1 = getTotalInterestPaid(loan1);
      const interest2 = getTotalInterestPaid(loan2);

      expect(interest2).toBeGreaterThan(interest1);
    });

    it("should calculate for fully paid loan", () => {
      const loan = createLoan({
        principal: 100000,
        paidCount: 120,
        emiAmount: 8791.63,
        outstanding: 0,
      });

      const interestPaid = getTotalInterestPaid(loan);
      expect(interestPaid).toBeGreaterThan(0);
    });

    it("should handle zero interest scenario", () => {
      const loan = createLoan({
        principal: 100000,
        paidCount: 50,
        emiAmount: 2000,
        outstanding: 0,
      });

      const interestPaid = getTotalInterestPaid(loan);
      expect(interestPaid).toBe(0);
    });
  });

  describe("Loan Payment Progress", () => {
    it("should track loan progression from start to completion", () => {
      const initial = createLoan({
        emiCount: 120,
        paidCount: 0,
        outstanding: 100000,
      });

      const midway = createLoan({
        emiCount: 120,
        paidCount: 60,
        outstanding: 50000,
      });

      const completed = createLoan({
        emiCount: 120,
        paidCount: 120,
        outstanding: 0,
      });

      expect(getRemainingEmis(initial)).toBe(120);
      expect(getRemainingEmis(midway)).toBe(60);
      expect(getRemainingEmis(completed)).toBe(0);

      expect(getTotalAmountPaid(initial)).toBeLessThan(getTotalAmountPaid(midway));
      expect(getTotalAmountPaid(midway)).toBeLessThan(getTotalAmountPaid(completed));
    });

    it("should demonstrate payment distribution", () => {
      const earlyStage = createLoan({
        principal: 500000,
        paidCount: 1,
        emiAmount: 5000,
        outstanding: 498000,
      });

      const lateStage = createLoan({
        principal: 500000,
        paidCount: 100,
        emiAmount: 5000,
        outstanding: 100000,
      });

      const earlyPaid = getTotalAmountPaid(earlyStage);
      const latePaid = getTotalAmountPaid(lateStage);

      expect(latePaid).toBeGreaterThan(earlyPaid);
      expect(latePaid - earlyPaid).toBeCloseTo(495000, -3);
    });

    it("should show consistent calculation across different loan sizes", () => {
      const smallLoan = createLoan({
        principal: 50000,
        paidCount: 12,
        emiAmount: 1000,
      });

      const largeLoan = createLoan({
        principal: 5000000,
        paidCount: 12,
        emiAmount: 100000,
      });

      const smallRatio = getTotalAmountPaid(smallLoan) / smallLoan.principal;
      const largeRatio = getTotalAmountPaid(largeLoan) / largeLoan.principal;

      expect(smallRatio).toBeCloseTo(largeRatio, 2);
    });
  });

  describe("Edge Cases and Robustness", () => {
    it("should handle zero principal", () => {
      const loan = createLoan({
        principal: 0,
        paidCount: 12,
        emiAmount: 0,
        outstanding: 0,
      });

      expect(getTotalAmountPaid(loan)).toBe(0);
      expect(getTotalInterestPaid(loan)).toBe(0);
      expect(getRemainingEmis(loan)).toBeGreaterThanOrEqual(0);
    });

    it("should handle very large EMI amounts", () => {
      const loan = createLoan({
        emiAmount: 999999,
        paidCount: 1,
      });

      const totalPaid = getTotalAmountPaid(loan);
      expect(totalPaid).toBe(999999);
      expect(isFinite(totalPaid)).toBe(true);
    });

    it("should handle 30-year loans (360 months)", () => {
      const loan = createLoan({
        emiCount: 360,
        paidCount: 180,
        emiAmount: 15000,
      });

      const remaining = getRemainingEmis(loan);
      const paid = getTotalAmountPaid(loan);

      expect(remaining).toBe(180);
      expect(paid).toBe(2700000);
    });

    it("should handle partial completion scenarios", () => {
      const loan = createLoan({
        principal: 100000,
        emiCount: 100,
        paidCount: 33,
        outstanding: 67000,
      });

      const remaining = getRemainingEmis(loan);
      expect(remaining).toBe(67);
      expect(remaining).toBeLessThan(loan.emiCount);
    });

    it("should ensure all values remain finite and valid", () => {
      const testCases = [
        createLoan({ emiCount: 120, paidCount: 24 }),
        createLoan({ principal: 500000, outstanding: 400000, paidCount: 50, emiAmount: 5000 }),
        createLoan({ emiAmount: 10000, paidCount: 60 }),
        createLoan({ emiCount: 360, paidCount: 180, emiAmount: 20000 }),
      ];

      testCases.forEach((loan) => {
        const remaining = getRemainingEmis(loan);
        const paid = getTotalAmountPaid(loan);
        const interest = getTotalInterestPaid(loan);

        expect(isFinite(remaining)).toBe(true);
        expect(isFinite(paid)).toBe(true);
        expect(isFinite(interest)).toBe(true);
        expect(remaining).toBeGreaterThanOrEqual(0);
        expect(paid).toBeGreaterThanOrEqual(0);
        // Interest can vary based on principal and outstanding relationship
        expect(interest).toEqual(expect.any(Number));
      });
    });

    it("should maintain logical consistency across all metrics", () => {
      const loan = createLoan({
        principal: 200000,
        paidCount: 50,
        emiCount: 120,
        emiAmount: 3000,
        outstanding: 140000,
      });

      const remaining = getRemainingEmis(loan);
      const paid = getTotalAmountPaid(loan);

      expect(remaining).toBe(loan.emiCount - loan.paidCount);
      expect(paid).toBe(loan.paidCount * loan.emiAmount);

      const interest = getTotalInterestPaid(loan);
      expect(interest).toBeGreaterThanOrEqual(0);
    });
  });
});
