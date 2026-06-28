import { describe, it, expect } from "vitest";
import { calculateMetrics } from "@/lib/calculations";
import { Store } from "@/hooks/useStore";

const createStore = (overrides: Partial<Store> = {}): Store => ({
  accounts: [],
  creditCards: [],
  loans: [],
  transactions: [],
  liabilities: [],
  lends: [],
  categories: [],
  history: [],
  ...overrides,
});

describe("Lent tracking exclusion", () => {
  it("does not include active Lent accounts in total assets or net worth", () => {
    const store = createStore({
      accounts: [
        { id: "acct-1", name: "Bank", type: "bank", balance: 1000, deleted: false },
        { id: "acct-2", name: "Lent", type: "other", balance: 500, deleted: false },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Card",
          provider: "Bank",
          creditLimit: 1000,
          outstanding: 200,
          unbilled: 0,
          statementDate: 1,
          dueDate: 15,
          nextDueDate: "2026-06-30",
          deleted: false,
        },
      ],
    });

    const metrics = calculateMetrics(store);

    expect(metrics.totalAssets).toBe(1000);
    expect(metrics.netWorth).toBe(800);
  });

  it("does not change financial summaries when Lent account balance changes", () => {
    const baseStore = createStore({
      accounts: [
        { id: "acct-1", name: "Bank", type: "bank", balance: 1000, deleted: false },
        { id: "acct-2", name: "Lent", type: "other", balance: 500, deleted: false },
      ],
    });

    const metricsBefore = calculateMetrics(baseStore);
    const storeAfter = createStore({
      accounts: [
        { id: "acct-1", name: "Bank", type: "bank", balance: 1000, deleted: false },
        { id: "acct-2", name: "Lent", type: "other", balance: 1000, deleted: false },
      ],
    });

    const metricsAfter = calculateMetrics(storeAfter);

    expect(metricsBefore.totalAssets).toBe(metricsAfter.totalAssets);
    expect(metricsBefore.netWorth).toBe(metricsAfter.netWorth);
  });

  it("excludes archived Lent accounts from all financial calculations", () => {
    const store = createStore({
      accounts: [
        { id: "acct-1", name: "Bank", type: "bank", balance: 1000, deleted: false },
        { id: "acct-2", name: "Lent", type: "other", balance: 500, deleted: false, archivedAt: "2026-06-01T00:00:00.000Z" },
      ],
    });

    const metrics = calculateMetrics(store);

    expect(metrics.totalAssets).toBe(1000);
    expect(metrics.netWorth).toBe(1000);
  });
});
