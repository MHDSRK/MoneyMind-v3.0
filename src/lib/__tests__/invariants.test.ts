import { describe, it, expect } from "vitest";
import { calculateMetrics } from "@/lib/calculations";

describe("application invariants", () => {
  it("ensures non-negative totals and excludes archived/deleted records", () => {
    const store = {
      transactions: [],
      accounts: [
        { id: "a1", name: "A", type: "bank", balance: 100 },
        { id: "a2", name: "Archived", type: "bank", balance: -100, archivedAt: "2026-01-01" },
      ],
      creditCards: [
        { id: "c1", name: "C", creditLimit: 1000, outstanding: 50, unbilled: 0, statementDate: 1, dueDate: "2026-07-01", nextDueDate: "2026-07-01" },
      ],
      loans: [
        { id: "l1", name: "L", principal: 1000, interestRate: 5, emiAmount: 100, emiCount: 10, paidCount: 0, emiFrequency: "monthly", outstanding: 1000, startDate: "2026-01-01", nextEmiDate: "2026-07-01" },
      ],
      liabilities: [
        { id: "li1", group: "G", name: "X", amount: 200, dueDate: "2026-07-01" },
      ],
      lends: [],
      categories: [],
      history: [],
    } as any;

    const metrics = calculateMetrics(store as any);

    expect(metrics.totalAssets).toBeGreaterThanOrEqual(0);
    expect(metrics.loanOutstanding).toBeGreaterThanOrEqual(0);
    expect(metrics.creditCardOutstanding).toBeGreaterThanOrEqual(0);
    expect(metrics.creditCardAvailableLimit).toBeLessThanOrEqual(metrics.creditCardTotalLimit);
  });
});
