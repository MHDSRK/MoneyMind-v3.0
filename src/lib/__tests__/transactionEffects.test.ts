import { describe, it, expect, vi, afterEach } from "vitest";
import { createTransaction } from "@/lib/transactionEffects";
import { Store } from "@/hooks/useStore";

const createStore = (overrides: Partial<Store> = {}): Store => ({
  accounts: [],
  creditCards: [],
  loans: [],
  transactions: [],
  liabilities: [],
  lends: [],
  categories: [],
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("transactionEffects card timestamps", () => {
  it("updates updatedAt when a card purchase changes card balances", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00.000Z"));

    const store = createStore({
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 100000,
          outstanding: 1000,
          unbilled: 100,
          statementDate: 31,
          dueDate: 15,
          nextDueDate: "2026-06-30",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const updated = createTransaction(store, {
      type: "out",
      amount: 500,
      ledger: "Groceries",
      category: "Home Expenses",
      fromCardId: "card-1",
      date: "2026-06-15",
    });

    const card = updated.creditCards.find((item) => item.id === "card-1");
    expect(card).toBeDefined();
    expect(card?.outstanding).toBe(1500);
    expect(card?.updatedAt).toBe("2026-06-15T10:00:00.000Z");
  });

  it("updates updatedAt when a card payment changes outstanding", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T09:30:00.000Z"));

    const store = createStore({
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 100000,
          outstanding: 3000,
          unbilled: 400,
          statementDate: 10,
          dueDate: 15,
          nextDueDate: "2026-06-30",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const updated = createTransaction(store, {
      type: "in",
      amount: 700,
      ledger: "Card Payment",
      category: "Repayment",
      toCardId: "card-1",
      date: "2026-06-16",
    });

    const card = updated.creditCards.find((item) => item.id === "card-1");
    expect(card).toBeDefined();
    expect(card?.outstanding).toBe(2300);
    expect(card?.unbilled).toBe(400);
    expect(card?.updatedAt).toBe("2026-06-16T09:30:00.000Z");
  });

  it("rejects a card payment greater than outstanding", () => {
    const store = createStore({
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 100000,
          outstanding: 2000,
          unbilled: 0,
          statementDate: 10,
          dueDate: 15,
          nextDueDate: "2026-06-30",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    expect(() =>
      createTransaction(store, {
        type: "in",
        amount: 2001,
        ledger: "Card Payment",
        category: "Repayment",
        toCardId: "card-1",
        date: "2026-06-16",
      })
    ).toThrow("Card payment cannot exceed the outstanding amount");
  });
});
