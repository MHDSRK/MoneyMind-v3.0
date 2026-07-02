import { describe, it, expect } from "vitest";
import { freezeArchivedRecords, normalizeStore, Store, isCategoryAvailableForTransactionType } from "@/hooks/useStore";

describe("freezeArchivedRecords", () => {
  const createStore = (overrides: Partial<Store> = {}): Store => ({
    transactions: [],
    accounts: [],
    creditCards: [],
    loans: [],
    liabilities: [],
    lends: [],
    categories: [],
    history: [],
    ...overrides,
  });

  it("preserves archived records unchanged when the next store attempts an edit", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Edited Savings",
            type: "bank",
            balance: 2000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).toBe(previous.accounts[0]);
    expect(frozen.accounts[0].name).toBe("Archived Savings");
    expect(frozen.accounts[0].balance).toBe(1000);
  });

  it("allows archived records to be restored when archivedAt is cleared", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Restored Savings",
            type: "bank",
            balance: 1500,
            archivedAt: undefined,
            isArchived: false,
          },
        ],
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).not.toBe(previous.accounts[0]);
    expect(frozen.accounts[0].name).toBe("Restored Savings");
    expect(frozen.accounts[0].balance).toBe(1500);
  });

  it("keeps archived records from being deleted or filtered out by automations", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [] as any,
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).toEqual(previous.accounts[0]);
  });

  it("preserves account notes during store normalization", () => {
    const input = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-2",
            name: "Lent to Ravi",
            type: "other",
            balance: 100,
            notes: "Paid on June 15",
            deleted: false,
          },
        ],
      })
    );

    expect(input.accounts).toHaveLength(1);
    expect(input.accounts[0].notes).toBe("Paid on June 15");
  });

  it("registers missing transaction categories without changing the stored category names", () => {
    const input = normalizeStore(
      createStore({
        transactions: [
          {
            id: "tx-1",
            date: "2026-07-01",
            ledger: "Freelance client",
            amount: 100,
            type: "in",
            category: "Freelance",
            notes: "",
            tags: [],
          },
          {
            id: "tx-2",
            date: "2026-07-01",
            ledger: "Groceries",
            amount: 50,
            type: "out",
            category: "Groceries",
            notes: "",
            tags: [],
          },
        ],
        categories: [
          { id: "income", name: "Income", type: "in" },
          { id: "others-out", name: "Others", type: "out" },
        ],
      })
    );

    expect(input.transactions[0].category).toBe("Freelance");
    expect(input.transactions[1].category).toBe("Groceries");

    const incomeCategories = input.categories.filter((category) => category.type === "in");
    const outCategories = input.categories.filter((category) => category.type === "out");

    expect(incomeCategories.map((category) => category.name)).toContain("Freelance");
    expect(outCategories.map((category) => category.name)).toContain("Groceries");
    expect(incomeCategories.filter((category) => category.name === "Freelance")).toHaveLength(1);
    expect(outCategories.filter((category) => category.name === "Groceries")).toHaveLength(1);
  });

  it("keeps category migration idempotent across repeated normalization", () => {
    const input = createStore({
      transactions: [
        {
          id: "tx-3",
          date: "2026-07-02",
          ledger: "Consulting",
          amount: 80,
          type: "in",
          category: "Consulting",
          notes: "",
          tags: [],
        },
      ],
    });

    const once = normalizeStore(input);
    const twice = normalizeStore(once);

    const consultingCategories = twice.categories.filter(
      (category) => category.type === "in" && category.name === "Consulting"
    );

    expect(consultingCategories).toHaveLength(1);
    expect(twice.transactions[0].category).toBe("Consulting");
  });

  it("accepts custom categories in the shared registry for the matching transaction type", () => {
    const store = normalizeStore(
      createStore({
        categories: [
          { id: "custom-in", name: "Freelance", type: "in" },
          { id: "custom-out", name: "Groceries", type: "out" },
        ],
      })
    );

    expect(isCategoryAvailableForTransactionType(store, "Freelance", "in")).toBe(true);
    expect(isCategoryAvailableForTransactionType(store, "Freelance", "out")).toBe(false);
    expect(isCategoryAvailableForTransactionType(store, "Groceries", "out")).toBe(true);
  });
});
