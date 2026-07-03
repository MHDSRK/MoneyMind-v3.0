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
    // ✅ Previous unbilled becomes the new outstanding
    expect(card?.outstanding).toBe(200);
    // ✅ Unbilled is reset to zero
    expect(card?.unbilled).toBe(0);
    // ✅ Dates are advanced
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

  it("moves unbilled to outstanding when marking credit card payment as paid (example: ₹179994.70 due + ₹1086.70 unbilled)", () => {
    const store = createStore({
      accounts: [
        {
          id: "bank",
          name: "Bank Account",
          type: "bank",
          balance: 200000,
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Visa Card",
          provider: "Test Bank",
          creditLimit: 337000,
          outstanding: 179994.70,
          unbilled: 1086.70,
          statementDate: 1,
          dueDate: "2026-07-10",
          nextDueDate: "2026-08-10T00:00:00.000Z",
          deleted: false,
          archivedAt: undefined,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    // Before payment:
    // Outstanding = ₹179994.70 (current due)
    // Unbilled = ₹1086.70 (next due)
    // Available = 337000 - 179994.70 - 1086.70 = 155918.60
    const beforeCard = store.creditCards[0];
    const availableBefore = 337000 - beforeCard.outstanding - (beforeCard.unbilled ?? 0);
    expect(availableBefore).toBeCloseTo(155918.6);

    // Process payment of full outstanding
    const updated = processUpcomingDuePayment(store, {
      entityType: "credit-card",
      entityId: "card-1",
      fromAccountId: "bank",
      amount: 179994.70,
      date: "2026-07-10",
    });

    // After payment:
    // Outstanding should be ₹1086.70 (previous unbilled)
    // Unbilled should be ₹0.00
    // Available = 337000 - 1086.70 - 0 = 335913.30
    const afterCard = updated.creditCards.find((item) => item.id === "card-1");
    expect(afterCard).toBeDefined();
    expect(afterCard?.outstanding).toBeCloseTo(1086.70);
    expect(afterCard?.unbilled).toBe(0);

    const availableAfter = 337000 - (afterCard?.outstanding ?? 0) - (afterCard?.unbilled ?? 0);
    expect(availableAfter).toBeCloseTo(335913.30);

    // ✅ Bank account balance reduced by payment
    const updatedBank = updated.accounts.find((a) => a.id === "bank");
    expect(updatedBank?.balance).toBeCloseTo(20005.30);

    // ✅ Dates advanced
    expect(afterCard?.dueDate).not.toBe("2026-07-10");
    expect(afterCard?.nextDueDate).not.toBe("2026-08-10T00:00:00.000Z");
  });
});
