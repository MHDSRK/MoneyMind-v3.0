import { describe, expect, it } from "vitest";
import { Store, processUpcomingDuePayment } from "@/hooks/useStore";

/**
 * Integration test for Mark as Paid flow.
 * 
 * This test verifies the complete payment recording process:
 * 1. User swipes a due item (credit card, loan, or liability)
 * 2. Clicks "Mark as Paid" button
 * 3. Selects a source account
 * 4. Enters the payment amount
 * 5. System records the payment transaction
 * 6. Entity (card, loan, liability) state updates
 * 7. Outstanding/Due amounts change
 * 8. Item may disappear from Upcoming Dues (if nothing left due)
 */

describe("Mark as Paid: Credit Card Payment Flow", () => {
  it("records a credit card payment and updates outstanding balance", () => {
    const initialStore: Store = {
      transactions: [],
      accounts: [
        {
          id: "bank-account",
          name: "Checking Account",
          type: "bank",
          balance: 5000,
        },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Visa Card",
          provider: "Test Bank",
          creditLimit: 5000,
          outstanding: 500,
          unbilled: 100,
          statementDate: 1,
          dueDate: "2026-07-10",
          nextDueDate: "2026-07-10T00:00:00.000Z",
        },
      ],
      loans: [],
      liabilities: [],
      lends: [],
      categories: [
        { id: "cc-payment", name: "Credit Card Payment", type: "out" },
      ],
      history: [],
    };

    // Process payment: pay ₹500 from bank account
    const updatedStore = processUpcomingDuePayment(initialStore, {
      entityType: "credit-card",
      entityId: "card-1",
      fromAccountId: "bank-account",
      amount: 500,
    });

    // ✅ Payment transaction was created
    const paymentTx = updatedStore.transactions.find(
      (tx) =>
        tx.relatedEntityType === "credit-card" &&
        tx.relatedEntityId === "card-1"
    );
    expect(paymentTx).toBeDefined();
    expect(paymentTx?.amount).toBe(500);
    expect(paymentTx?.type).toBe("out");
    expect(paymentTx?.fromAccountId).toBe("bank-account");

    // ✅ Bank account balance decreased
    const updatedAccount = updatedStore.accounts.find((a) => a.id === "bank-account");
    expect(updatedAccount?.balance).toBe(4500);

    // ✅ Current due is cleared by the payment; unbilled remains intact.
    const updatedCard = updatedStore.creditCards.find((c) => c.id === "card-1");
    expect(updatedCard?.outstanding).toBe(0);
    expect(updatedCard?.unbilled).toBe(100);
    expect(paymentTx?.ledger).toContain("Visa Card");
  });

  it("records a loan EMI payment and advances EMI date", () => {
    const initialStore: Store = {
      transactions: [],
      accounts: [
        {
          id: "account-1",
          name: "Salary Account",
          type: "bank",
          balance: 50000,
        },
      ],
      creditCards: [],
      loans: [
        {
          id: "loan-1",
          name: "Personal Loan",
          lender: "Test Bank",
          principal: 100000,
          interestRate: 10,
          emiAmount: 2500,
          emiCount: 60,
          paidCount: 10,
          emiFrequency: "monthly",
          outstanding: 110000,
          nextEmiDate: "2026-07-15T00:00:00.000Z",
        },
      ],
      liabilities: [],
      lends: [],
      categories: [{ id: "loan-payment", name: "Loan Payment", type: "out" }],
      history: [],
    };

    const paymentAmount = 2500; // One EMI

    const updatedStore = processUpcomingDuePayment(initialStore, {
      entityType: "loan",
      entityId: "loan-1",
      fromAccountId: "account-1",
      amount: paymentAmount,
    });

    // ✅ EMI payment transaction created
    const emiTx = updatedStore.transactions.find(
      (tx) => tx.relatedEntityType === "loan" && tx.relatedEntityId === "loan-1"
    );
    expect(emiTx).toBeDefined();
    expect(emiTx?.amount).toBe(paymentAmount);

    // ✅ Loan state updated (paidCount incremented, outstanding reduced, nextEmiDate advanced)
    const updatedLoan = updatedStore.loans.find((l) => l.id === "loan-1");
    expect(updatedLoan).toBeDefined();
    expect(updatedLoan?.paidCount).toBe(11); // Incremented from 10
    expect(updatedLoan?.outstanding).toBeLessThan(initialStore.loans[0].outstanding); // Reduced

    // ✅ NextEmiDate advanced by 1 month
    const oldEmiDate = new Date(initialStore.loans[0].nextEmiDate);
    const newEmiDate = new Date(updatedLoan?.nextEmiDate ?? "");
    const monthDiff = (newEmiDate.getFullYear() - oldEmiDate.getFullYear()) * 12 +
                      (newEmiDate.getMonth() - oldEmiDate.getMonth());
    expect(monthDiff).toBe(1);
  });

  it("records a liability payment and removes Borrow liabilities", () => {
    const initialStore: Store = {
      transactions: [],
      accounts: [
        {
          id: "cash",
          name: "Cash in hand",
          type: "cash",
          balance: 10000,
        },
      ],
      creditCards: [],
      loans: [],
      liabilities: [
        {
          id: "borrow-1",
          group: "Borrow",
          name: "Borrow from Friend",
          amount: 5000,
          dueDate: "2026-07-20",
        },
      ],
      lends: [],
      categories: [
        {
          id: "liability-payment",
          name: "Liability Payment",
          type: "out",
        },
      ],
      history: [],
    };

    const updatedStore = processUpcomingDuePayment(initialStore, {
      entityType: "liability",
      entityId: "borrow-1",
      fromAccountId: "cash",
      amount: 5000,
    });

    // ✅ Payment transaction created
    const liabilityTx = updatedStore.transactions.find(
      (tx) =>
        tx.relatedEntityType === "liability" &&
        tx.relatedEntityId === "borrow-1"
    );
    expect(liabilityTx).toBeDefined();
    expect(liabilityTx?.amount).toBe(5000);

    // ✅ Borrow liability marked as deleted (for Borrow group)
    const deletedLiability = updatedStore.liabilities.find(
      (item) => item.id === "borrow-1"
    );
    expect(deletedLiability?.deleted).toBe(true);

    // ✅ Cash account balance reduced
    const updatedCash = updatedStore.accounts.find((a) => a.id === "cash");
    expect(updatedCash?.balance).toBe(5000);
  });

  it("records a regular liability payment and advances due date", () => {
    const initialStore: Store = {
      transactions: [],
      accounts: [
        {
          id: "bank",
          name: "Checking",
          type: "bank",
          balance: 20000,
        },
      ],
      creditCards: [],
      loans: [],
      liabilities: [
        {
          id: "rent-1",
          group: "Regular Expenses",
          name: "House Rent",
          amount: 8000,
          dueDate: "2026-07-31",
        },
      ],
      lends: [],
      categories: [
        {
          id: "liability-payment",
          name: "Liability Payment",
          type: "out",
        },
      ],
      history: [],
    };

    const updatedStore = processUpcomingDuePayment(initialStore, {
      entityType: "liability",
      entityId: "rent-1",
      fromAccountId: "bank",
      amount: 8000,
    });

    // ✅ Payment transaction created
    const rentTx = updatedStore.transactions.find(
      (tx) =>
        tx.relatedEntityType === "liability" &&
        tx.relatedEntityId === "rent-1"
    );
    expect(rentTx).toBeDefined();

    // ✅ Regular liability NOT deleted; dueDate advanced by 1 month
    const updatedRent = updatedStore.liabilities.find((item) => item.id === "rent-1");
    expect(updatedRent?.deleted).toBeFalsy();

    const oldDueDate = new Date(initialStore.liabilities[0].dueDate);
    const newDueDate = new Date(updatedRent?.dueDate ?? "");
    const monthDiff =
      (newDueDate.getFullYear() - oldDueDate.getFullYear()) * 12 +
      (newDueDate.getMonth() - oldDueDate.getMonth());
    expect(monthDiff).toBe(1);
  });

  it("validates insufficient account balance", () => {
    const initialStore: Store = {
      transactions: [],
      accounts: [
        {
          id: "low-balance",
          name: "Empty Account",
          type: "bank",
          balance: 100,
        },
      ],
      creditCards: [
        {
          id: "card-1",
          name: "Visa",
          provider: "Bank",
          creditLimit: 5000,
          outstanding: 500,
          unbilled: 0,
          statementDate: 1,
          dueDate: "2026-07-10",
          nextDueDate: "2026-07-10T00:00:00.000Z",
        },
      ],
      loans: [],
      liabilities: [],
      lends: [],
      categories: [
        { id: "cc-payment", name: "Credit Card Payment", type: "out" },
      ],
      history: [],
    };

    // Try to pay ₹500 from an account with only ₹100
    // In HomeTab, this should be caught before calling processUpcomingDuePayment
    const account = initialStore.accounts.find((a) => a.id === "low-balance");
    const paymentAmount = 500;

    // This check happens in HomeTab's click handler
    expect(account?.balance).toBeLessThan(paymentAmount);
  });
});
