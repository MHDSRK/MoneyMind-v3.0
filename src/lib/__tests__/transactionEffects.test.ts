import { describe, it, expect, vi, afterEach } from "vitest";
import { createTransaction, createUnbilledTransaction } from "@/lib/transactionEffects";
import { Store, deleteTransactionFromStore, restoreTransactionFromStore, updateTransactionInStore } from "@/hooks/useStore";

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
  it("creates a quick-add unbilled transaction for a card", () => {
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
          dueDate: "2026-06-15",
          nextDueDate: "2026-06-30",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const updated = createUnbilledTransaction(store, "card-1", 250);
    const card = updated.creditCards.find((item) => item.id === "card-1");
    expect(card?.unbilled).toBe(350);
    expect(updated.transactions).toHaveLength(1);
  });

  it("deletes and restores a transaction while adjusting balances", () => {
    const store = createStore({
      accounts: [
        {
          id: "acct-1",
          name: "Checking",
          type: "bank",
          balance: 1000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const created = createTransaction(store, {
      id: "tx-1",
      type: "out",
      amount: 200,
      ledger: "Groceries",
      category: "Home Expenses",
      fromAccountId: "acct-1",
      date: "2026-06-15",
    });

    const deleted = deleteTransactionFromStore(created, created.transactions[0]);
    expect(deleted.transactions).toHaveLength(0);
    expect(deleted.accounts[0].balance).toBe(1000);

    const restored = restoreTransactionFromStore(deleted, created.transactions[0]);
    expect(restored.transactions).toHaveLength(1);
    expect(restored.accounts[0].balance).toBe(800);
  });

  it("updates balances when an existing transaction is edited", () => {
    const store = createStore({
      accounts: [
        {
          id: "acct-1",
          name: "Checking",
          type: "bank",
          balance: 1000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const created = createTransaction(store, {
      id: "tx-1",
      type: "out",
      amount: 200,
      ledger: "Groceries",
      category: "Home Expenses",
      fromAccountId: "acct-1",
      date: "2026-06-15",
    });

    const updated = updateTransactionInStore(created, created.transactions[0], {
      id: "tx-1",
      type: "out",
      amount: 100,
      ledger: "Groceries",
      category: "Home Expenses",
      fromAccountId: "acct-1",
      date: "2026-06-15",
      notes: "Adjusted",
    });

    const account = updated.accounts.find((item) => item.id === "acct-1");
    expect(account?.balance).toBe(900);
    expect(updated.transactions[0].notes).toBe("Adjusted");
  });

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
          dueDate: "2026-06-15",
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
          dueDate: "2026-06-15",
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
          dueDate: "2026-06-15",
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
