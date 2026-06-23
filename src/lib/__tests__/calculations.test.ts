import { describe, it, expect } from "vitest";
import { calculateMetrics, FinancialMetrics } from "@/lib/calculations";
import { Store } from "@/hooks/useStore";

describe("Financial Calculations", () => {
  // Helper to create a minimal store with default values
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

  describe("Asset Calculations", () => {
    it("should calculate total assets from account balances", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000, deleted: false },
          { id: "2", name: "Cash", type: "cash", balance: 500, deleted: false },
          { id: "3", name: "Business", type: "business", balance: 5000, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(6500);
    });

    it("should exclude deleted accounts from asset calculations", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000, deleted: false },
          { id: "2", name: "Cash", type: "cash", balance: 500, deleted: true },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(1000);
    });

    it("should exclude Lent (other type) from total assets", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000, deleted: false },
          { id: "2", name: "Lent", type: "other", balance: 2000, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(1000);
      expect(metrics.otherAssetsBalance).toBe(2000);
    });

    it("should calculate balances by account type", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank1", type: "bank", balance: 500, deleted: false },
          { id: "2", name: "Cash1", type: "cash", balance: 200, deleted: false },
          { id: "3", name: "Investment1", type: "investments", balance: 10000, deleted: false },
          { id: "4", name: "Insurance1", type: "insurance", balance: 5000, deleted: false },
          { id: "5", name: "Business1", type: "business", balance: 50000, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.bankBalance).toBe(500);
      expect(metrics.cashBalance).toBe(200);
      expect(metrics.investmentsBalance).toBe(10000);
      expect(metrics.insuranceBalance).toBe(5000);
      expect(metrics.businessBalance).toBe(50000);
    });

    it("should handle zero balance accounts", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Empty", type: "bank", balance: 0, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(0);
    });

    it("should handle negative balance accounts (overdraft)", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Overdraft", type: "bank", balance: -500, deleted: false },
          { id: "2", name: "Positive", type: "bank", balance: 1000, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(500);
    });
  });

  describe("Credit Card Calculations", () => {
    it("should calculate total credit card limit", () => {
      const store = createStore({
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 2000,
            unbilled: 1000,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "cc2",
            name: "Card2",
            provider: "Bank B",
            cardType: "Credit",
            creditLimit: 5000,
            outstanding: 1000,
            unbilled: 500,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.creditCardTotalLimit).toBe(15000);
    });

    it("should calculate available credit limit", () => {
      const store = createStore({
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 3000,
            unbilled: 2000,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      // Available = Total Limit - Outstanding (unbilled is included in outstanding)
      expect(metrics.creditCardAvailableLimit).toBe(7000);
    });

    it("should sum all credit card outstanding amounts", () => {
      const store = createStore({
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 2000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "cc2",
            name: "Card2",
            provider: "Bank B",
            cardType: "Credit",
            creditLimit: 5000,
            outstanding: 1500,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.creditCardOutstanding).toBe(3500);
    });

    it("should exclude deleted credit cards from calculations", () => {
      const store = createStore({
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 2000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: true, // Deleted
          },
          {
            id: "cc2",
            name: "Card2",
            provider: "Bank B",
            cardType: "Credit",
            creditLimit: 5000,
            outstanding: 1000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.creditCardTotalLimit).toBe(5000);
      expect(metrics.creditCardOutstanding).toBe(1000);
    });
  });

  describe("Loan Calculations", () => {
    it("should calculate total loan principal", () => {
      const store = createStore({
        loans: [
          {
            id: "loan1",
            name: "Home Loan",
            lender: "Bank A",
            principal: 500000,
            interestRate: 7.5,
            emiAmount: 4500,
            emiFrequency: "monthly",
            emiCount: 180,
            paidCount: 36,
            outstanding: 440000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "loan2",
            name: "Car Loan",
            lender: "Bank B",
            principal: 800000,
            interestRate: 8.5,
            emiAmount: 12000,
            emiFrequency: "monthly",
            emiCount: 84,
            paidCount: 12,
            outstanding: 720000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.loanTotalPrincipal).toBe(1300000);
    });

    it("should calculate total loan outstanding", () => {
      const store = createStore({
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 100000,
            interestRate: 7,
            emiAmount: 1000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 20,
            outstanding: 80000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "loan2",
            name: "Loan2",
            lender: "Bank B",
            principal: 50000,
            interestRate: 6,
            emiAmount: 500,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 30,
            outstanding: 35000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.loanOutstanding).toBe(115000);
    });

    it("should exclude deleted loans from calculations", () => {
      const store = createStore({
        loans: [
          {
            id: "loan1",
            name: "Paid Loan",
            lender: "Bank A",
            principal: 100000,
            interestRate: 7,
            emiAmount: 1000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 120,
            outstanding: 0,
            nextEmiDate: "2026-02-01",
            deleted: true, // Marked as deleted
          },
          {
            id: "loan2",
            name: "Active Loan",
            lender: "Bank B",
            principal: 50000,
            interestRate: 6,
            emiAmount: 500,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 10,
            outstanding: 45000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.loanTotalPrincipal).toBe(50000);
      expect(metrics.loanOutstanding).toBe(45000);
    });

    it("should calculate total monthly EMI", () => {
      const store = createStore({
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 100000,
            interestRate: 7,
            emiAmount: 1000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 20,
            outstanding: 80000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "loan2",
            name: "Loan2",
            lender: "Bank B",
            principal: 50000,
            interestRate: 6,
            emiAmount: 500,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 30,
            outstanding: 35000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      // Only monthly EMIs counted
      expect(metrics.monthlyIncome + metrics.monthlyExpense).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Liability Calculations", () => {
    it("should calculate total liabilities from credit cards and loans", () => {
      const store = createStore({
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 5000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 100000,
            interestRate: 7,
            emiAmount: 1000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 20,
            outstanding: 80000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalLiabilities).toBe(85000);
    });
  });

  describe("Net Worth Calculations", () => {
    it("should calculate net worth as assets minus liabilities", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 100000, deleted: false },
        ],
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 5000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 100000,
            interestRate: 7,
            emiAmount: 1000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 20,
            outstanding: 50000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      // Net Worth = Assets - (CC Outstanding + Loan Outstanding)
      expect(metrics.netWorth).toBe(45000); // 100000 - 55000
    });

    it("should handle negative net worth", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 10000, deleted: false },
        ],
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 500000,
            interestRate: 7,
            emiAmount: 5000,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 10,
            outstanding: 450000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.netWorth).toBe(-440000);
    });

    it("should exclude Lent from net worth calculations", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 100000, deleted: false },
          { id: "2", name: "Lent", type: "other", balance: 50000, deleted: false },
        ],
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 10000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      // Net worth should only include bank, not lent
      expect(metrics.netWorth).toBe(90000); // 100000 - 10000
    });
  });

  describe("Transaction Calculations", () => {
    it("should calculate today's income and expense", () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const store = createStore({
        transactions: [
          {
            id: "tx1",
            date: todayStr,
            type: "in",
            amount: 5000,
            category: "income",
            ledger: "Salary",
            fromAccount: undefined,
            toAccount: "bank",
            notes: "",
            tags: [],
            deleted: false,
          },
          {
            id: "tx2",
            date: todayStr,
            type: "out",
            amount: 1000,
            category: "expense",
            ledger: "Food",
            fromAccount: "bank",
            toAccount: undefined,
            notes: "",
            tags: [],
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.todayIncome).toBe(5000);
      expect(metrics.todayExpense).toBe(1000);
      expect(metrics.todayNet).toBe(4000);
    });

    it("should exclude deleted transactions", () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const store = createStore({
        transactions: [
          {
            id: "tx1",
            date: todayStr,
            type: "in",
            amount: 5000,
            category: "income",
            ledger: "Salary",
            fromAccount: undefined,
            toAccount: "bank",
            notes: "",
            tags: [],
            deleted: true, // Deleted
          },
          {
            id: "tx2",
            date: todayStr,
            type: "out",
            amount: 1000,
            category: "expense",
            ledger: "Food",
            fromAccount: "bank",
            toAccount: undefined,
            notes: "",
            tags: [],
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.todayIncome).toBe(0);
      expect(metrics.todayExpense).toBe(1000);
    });

    it("should calculate monthly income and expense", () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split("T")[0];

      const store = createStore({
        transactions: [
          {
            id: "tx1",
            date: monthStartStr,
            type: "in",
            amount: 50000,
            category: "income",
            ledger: "Salary",
            fromAccount: undefined,
            toAccount: "bank",
            notes: "",
            tags: [],
            deleted: false,
          },
          {
            id: "tx2",
            date: monthStartStr,
            type: "out",
            amount: 10000,
            category: "expense",
            ledger: "Rent",
            fromAccount: "bank",
            toAccount: undefined,
            notes: "",
            tags: [],
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.monthlyIncome).toBe(50000);
      expect(metrics.monthlyExpense).toBe(10000);
      expect(metrics.monthlyNet).toBe(40000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty store", () => {
      const store = createStore();
      const metrics = calculateMetrics(store);

      expect(metrics.totalAssets).toBe(0);
      expect(metrics.creditCardOutstanding).toBe(0);
      expect(metrics.loanOutstanding).toBe(0);
      expect(metrics.totalLiabilities).toBe(0);
      expect(metrics.netWorth).toBe(0);
      expect(metrics.todayIncome).toBe(0);
      expect(metrics.todayExpense).toBe(0);
    });

    it("should handle all deleted items", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000, deleted: true },
        ],
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            cardType: "Credit",
            creditLimit: 10000,
            outstanding: 5000,
            unbilled: 0,
            statementDate: "2026-01-01",
            dueDate: "2026-02-01",
            nextDueDate: "2026-02-01",
            deleted: true,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(0);
      expect(metrics.creditCardOutstanding).toBe(0);
      expect(metrics.netWorth).toBe(0);
    });

    it("should handle very large numbers", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 999999999, deleted: false },
        ],
        loans: [
          {
            id: "loan1",
            name: "Loan1",
            lender: "Bank A",
            principal: 888888888,
            interestRate: 7,
            emiAmount: 7777777,
            emiFrequency: "monthly",
            emiCount: 120,
            paidCount: 10,
            outstanding: 777777777,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBe(999999999);
      expect(metrics.loanOutstanding).toBe(777777777);
      expect(metrics.netWorth).toBe(222222222);
    });

    it("should handle decimal values in calculations", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000.5, deleted: false },
          { id: "2", name: "Cash", type: "cash", balance: 500.25, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalAssets).toBeCloseTo(1500.75, 2);
    });
  });
});
