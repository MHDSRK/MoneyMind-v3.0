import { describe, it, expect } from "vitest";
import { updateLoan } from "@/hooks/useStore";

describe("loan emi stability", () => {
  it("does not change emiAmount implicitly when updating other fields", () => {
    const loan = {
      id: "loan-1",
      name: "Loan",
      lender: "Bank",
      principal: 10000,
      interestRate: 8,
      emiAmount: 200,
      emiCount: 60,
      paidCount: 0,
      emiFrequency: "monthly",
      outstanding: 10000,
      startDate: "2026-01-01",
      nextEmiDate: "2026-07-01",
    } as any;

    const store = { transactions: [], accounts: [], creditCards: [], loans: [loan], liabilities: [], lends: [], categories: [], history: [] } as any;

    const updated = updateLoan(store, "loan-1", { interestRate: 9 });
    const updatedLoan = updated.loans.find((l: any) => l.id === "loan-1");
    expect(updatedLoan.emiAmount).toBe(200);
  });
});
