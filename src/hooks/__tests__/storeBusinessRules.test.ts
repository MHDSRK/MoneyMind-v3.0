import { describe, it, expect } from "vitest";
import {
  normalizeStore,
  updateCreditCard,
  processUpcomingDuePayment,
  updateLoan,
  Store,
} from "@/hooks/useStore";

describe("store business rules", () => {
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

  it("preserves nextDueDate when only dueDate is changed on a credit card", () => {
    const store = createStore({
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 5000,
          outstanding: 1000,
          unbilled: 200,
          statementDate: 15,
          dueDate: "2026-07-15",
          nextDueDate: "2026-08-15T00:00:00.000Z",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    const updated = updateCreditCard(store, "card-1", { dueDate: "2026-07-20" });
    const card = updated.creditCards.find((item) => item.id === "card-1");

    expect(card).toBeDefined();
    expect(card?.dueDate).toBe("2026-07-20");
    expect(card?.nextDueDate).toBe("2026-08-15T00:00:00.000Z");
  });

  it("records a human-friendly ledger label for quick-pay credit card payments", () => {
    const store = createStore({
      accounts: [
        {
          id: "acct-1",
          name: "Cash",
          type: "cash",
          balance: 5000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 5000,
          outstanding: 1000,
          unbilled: 200,
          statementDate: 15,
          dueDate: "2026-07-15",
          nextDueDate: "2026-08-15T00:00:00.000Z",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    const updated = processUpcomingDuePayment(store, {
      entityType: "credit-card",
      entityId: "card-1",
      fromAccountId: "acct-1",
      amount: 500,
      date: "2026-07-10",
    });

    const tx = updated.transactions.find((t) => t.relatedEntityId === "card-1");
    expect(tx).toBeDefined();
    expect(tx?.ledger).toContain("Main Card");
  });

  it("resets credit card unbilled to zero and advances due dates on quick-pay", () => {
    const store = createStore({
      accounts: [
        {
          id: "acct-1",
          name: "Cash",
          type: "cash",
          balance: 5000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Main Card",
          provider: "Bank",
          creditLimit: 5000,
          outstanding: 1000,
          unbilled: 200,
          statementDate: 15,
          dueDate: "2026-07-15",
          nextDueDate: "2026-08-15T00:00:00.000Z",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    const updated = processUpcomingDuePayment(store, {
      entityType: "credit-card",
      entityId: "card-1",
      fromAccountId: "acct-1",
      amount: 500,
      date: "2026-07-10",
    });

    const card = updated.creditCards.find((item) => item.id === "card-1");
    expect(card).toBeDefined();
    expect(card?.unbilled).toBe(0);
    expect(card?.nextDueDate).not.toBe("2026-08-15T00:00:00.000Z");
    expect(card?.dueDate).not.toBe("2026-07-15");
  });

  it("increments loan paidCount without changing emiAmount on quick-pay", () => {
    const loan = {
      id: "loan-1",
      name: "Home Loan",
      lender: "Bank",
      principal: 100000,
      interestRate: 5,
      emi: 1,
      emiAmount: 2000,
      emiCount: 60,
      paidCount: 10,
      emiFrequency: "monthly" as const,
      outstanding: 90000,
      startDate: "2025-01-01",
      nextEmiDate: "2026-07-01T00:00:00.000Z",
      deleted: false,
      archivedAt: undefined,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };

    const store = createStore({
      accounts: [
        {
          id: "acct-1",
          name: "Cash",
          type: "cash",
          balance: 5000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      loans: [loan],
    });

    const updated = processUpcomingDuePayment(store, {
      entityType: "loan",
      entityId: "loan-1",
      fromAccountId: "acct-1",
      amount: 2000,
      date: "2026-07-10",
    });

    const updatedLoan = updated.loans.find((item) => item.id === "loan-1");
    expect(updatedLoan).toBeDefined();
    expect(updatedLoan?.paidCount).toBe(11);
    expect(updatedLoan?.emiAmount).toBe(2000);
    expect(updatedLoan?.outstanding).toBe(88000);
  });
});
