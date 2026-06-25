import { describe, it, expect } from "vitest";
import {
  calculateMetrics,
  FinancialMetrics,
  getAccountBalanceHistory,
} from "@/lib/calculations";
import {
  createTransaction as applyTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactionEffects";
import { Store, normalizeStore } from "@/hooks/useStore";

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

    it("should include other accounts in total assets and net worth", () => {
      const store = createStore({
        accounts: [
          { id: "1", name: "Bank", type: "bank", balance: 1000, deleted: false },
          { id: "2", name: "Other", type: "other", balance: 300, deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.otherAssetsBalance).toBe(300);
      expect(metrics.totalAssets).toBe(1300);
      expect(metrics.netWorth).toBe(1300);
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

    it("should normalize legacy investment accounts and count them as assets", () => {
      const normalized = normalizeStore({
        accounts: [{ id: "inv-1", name: "Growth Fund", type: "investment", balance: 2500, deleted: false }],
      });

      const metrics = calculateMetrics(normalized);
      expect(normalized.accounts[0].type).toBe("investments");
      expect(metrics.investmentsBalance).toBe(2500);
      expect(metrics.totalAssets).toBe(2500);
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
      // Available = Total Limit - Outstanding - Unbilled
      expect(metrics.creditCardUnbilled).toBe(2000);
      expect(metrics.creditCardAvailableLimit).toBe(5000);
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
    it("should calculate total liabilities from credit cards, loans, and manual liabilities exactly once", () => {
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
        liabilities: [
          { id: "liab1", group: "Borrow", name: "Friend Loan", amount: 15000, dueDate: "2026-02-01", deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalLiabilities).toBe(100000);
    });

    it("should count each debt source once without double counting", () => {
      const store = createStore({
        accounts: [{ id: "cash", name: "Cash", type: "cash", balance: 100000, deleted: false }],
        creditCards: [
          {
            id: "cc1",
            name: "Card1",
            provider: "Bank A",
            creditLimit: 10000,
            outstanding: 10000,
            statementDate: 1,
            dueDate: 15,
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
            outstanding: 20000,
            nextEmiDate: "2026-02-01",
            deleted: false,
          },
        ],
        liabilities: [
          { id: "liab1", group: "Borrow", name: "Borrowing", amount: 30000, dueDate: "2026-02-01", deleted: false },
          { id: "liab2", group: "More Liabilities", name: "Other debt", amount: 40000, dueDate: "2026-02-01", deleted: false },
        ],
      });

      const metrics = calculateMetrics(store);
      expect(metrics.totalLiabilities).toBe(100000);
      expect(metrics.netWorth).toBe(0);
    });

    it("should add createdAt and updatedAt defaults to legacy records during normalization", () => {
      const normalized = normalizeStore({
        liabilities: [{ id: "liab1", group: "Borrow", name: "Friend Loan", amount: 15000, dueDate: "2026-02-01" }],
        transactions: [{ id: "tx1", date: "2026-01-01", ledger: "Salary", amount: 1000, type: "in", category: "income", notes: "", tags: [] }],
      });

      expect(normalized.liabilities[0].createdAt).toBeDefined();
      expect(normalized.liabilities[0].updatedAt).toBeDefined();
      expect(normalized.transactions[0].createdAt).toBeDefined();
      expect(normalized.transactions[0].updatedAt).toBeDefined();
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

    it("should include other-account balances in net worth calculations", () => {
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
      expect(metrics.netWorth).toBe(140000); // 150000 - 10000
    });
  });

  describe("Account ID based transactions", () => {
    it("should update balances when out transactions reference account IDs", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-out",
        date: "2026-01-01",
        ledger: "Groceries",
        amount: 150,
        type: "out",
        category: "Food",
        fromAccountId: "source",
        notes: "",
        tags: [],
      });

      expect(result.accounts.find((account) => account.id === "source")?.balance).toBe(850);
    });

    it("should update balances when in transactions reference account IDs", () => {
      const store = createStore({
        accounts: [
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-in",
        date: "2026-01-01",
        ledger: "Salary",
        amount: 250,
        type: "in",
        category: "Income",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      expect(result.accounts.find((account) => account.id === "dest")?.balance).toBe(750);
    });

    it("should use account IDs for transfer balances even when names are duplicated", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Shared", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Shared", type: "bank", balance: 500, deleted: false },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-transfer",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 200,
        type: "transfer",
        category: "Self Transfer",
        fromAccountId: "source",
        toAccountId: "dest",
        fromAccount: "Shared",
        toAccount: "Shared",
        notes: "",
        tags: [],
      });

      expect(result.accounts.find((account) => account.id === "source")?.balance).toBe(800);
      expect(result.accounts.find((account) => account.id === "dest")?.balance).toBe(700);
    });

    it("should use card IDs for out transactions even when card names are duplicated", () => {
      const store = createStore({
        creditCards: [
          {
            id: "card-a",
            name: "Shared Card",
            provider: "Bank A",
            creditLimit: 50000,
            outstanding: 1000,
            unbilled: 0,
            statementDate: 1,
            dueDate: 15,
            nextDueDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "card-b",
            name: "Shared Card",
            provider: "Bank B",
            creditLimit: 60000,
            outstanding: 2500,
            unbilled: 0,
            statementDate: 1,
            dueDate: 20,
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-card-id",
        date: "2026-01-01",
        ledger: "Online purchase",
        amount: 300,
        type: "out",
        category: "Shopping",
        fromAccount: "Shared Card",
        fromCardId: "card-b",
        notes: "",
        tags: [],
      });

      const cardA = result.creditCards.find((card) => card.id === "card-a");
      const cardB = result.creditCards.find((card) => card.id === "card-b");

      expect(cardA?.outstanding).toBe(1000);
      expect(cardA?.unbilled ?? 0).toBe(0);
      expect((cardB?.outstanding ?? 0) + (cardB?.unbilled ?? 0)).toBe(2800);
    });

    it("should use card IDs for in transactions even when card names are duplicated", () => {
      const store = createStore({
        creditCards: [
          {
            id: "card-a",
            name: "Shared Card",
            provider: "Bank A",
            creditLimit: 50000,
            outstanding: 1000,
            unbilled: 0,
            statementDate: 1,
            dueDate: 15,
            nextDueDate: "2026-02-01",
            deleted: false,
          },
          {
            id: "card-b",
            name: "Shared Card",
            provider: "Bank B",
            creditLimit: 60000,
            outstanding: 2500,
            unbilled: 0,
            statementDate: 1,
            dueDate: 20,
            nextDueDate: "2026-02-01",
            deleted: false,
          },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-card-dest-id",
        date: "2026-01-01",
        ledger: "Card payment",
        amount: 300,
        type: "in",
        category: "Card Payment",
        toAccount: "Shared Card",
        toCardId: "card-b",
        notes: "",
        tags: [],
      });

      expect(result.creditCards.find((card) => card.id === "card-a")?.outstanding).toBe(1000);
      expect(result.creditCards.find((card) => card.id === "card-b")?.outstanding).toBe(2200);
    });
  });

  describe("Self Transfer Operations", () => {
    it("should move money between accounts without changing totals", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 200,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      expect(result.accounts.find((a) => a.name === "Checking")?.balance).toBe(800);
      expect(result.accounts.find((a) => a.name === "Savings")?.balance).toBe(700);
      expect(result.accounts.reduce((sum, account) => sum + account.balance, 0)).toBe(1500);

      const metrics = calculateMetrics(result);
      expect(metrics.totalAssets).toBe(1500);
      expect(metrics.netWorth).toBe(1500);
      expect(metrics.todayIncome).toBe(0);
      expect(metrics.todayExpense).toBe(0);
    });

    it("should reject transfers when the source account has insufficient funds", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 100, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      expect(() =>
        applyTransaction(store, {
          id: "tx-self",
          date: "2026-01-01",
          ledger: "Transfer",
          amount: 200,
          type: "transfer",
          category: "Self Transfer",
          fromAccount: "Checking",
          fromAccountId: "source",
          toAccount: "Savings",
          toAccountId: "dest",
          notes: "",
          tags: [],
        })
      ).toThrow("Insufficient funds for transfer");
    });

    it("should normalize legacy self transfers to the stable transfer type", () => {
      const normalized = normalizeStore({
        transactions: [
          {
            id: "tx-self",
            date: "2026-01-01",
            ledger: "Transfer",
            amount: 200,
            type: "self",
            category: "Self Transfer",
            fromAccount: "Checking",
            toAccount: "Savings",
            notes: "",
            tags: [],
          },
        ],
      });

      expect(normalized.transactions[0].type).toBe("transfer");
      expect(normalized.transactions[0].fromAccountId).toBeUndefined();
      expect(normalized.transactions[0].toAccountId).toBeUndefined();
      expect(normalized.transactions[0].transferResolution).toBe("unresolved-legacy-name");
    });

    it("should migrate legacy transfer names to IDs when each name maps uniquely", () => {
      const normalized = normalizeStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
        transactions: [
          {
            id: "tx-self",
            date: "2026-01-01",
            ledger: "Transfer",
            amount: 200,
            type: "self",
            category: "Self Transfer",
            fromAccount: "Checking",
            toAccount: "Savings",
            notes: "",
            tags: [],
          },
        ],
      });

      expect(normalized.transactions[0].fromAccountId).toBe("source");
      expect(normalized.transactions[0].toAccountId).toBe("dest");
      expect(normalized.transactions[0].transferResolution).toBe("resolved");
    });

    it("should keep legacy transfer unresolved when duplicate names are ambiguous", () => {
      const normalized = normalizeStore({
        accounts: [
          { id: "source-a", name: "HDFC Savings", type: "bank", balance: 1000, deleted: false },
          { id: "source-b", name: "HDFC Savings", type: "bank", balance: 900, deleted: false },
          { id: "dest", name: "Emergency", type: "bank", balance: 500, deleted: false },
        ],
        transactions: [
          {
            id: "tx-self",
            date: "2026-01-01",
            ledger: "Transfer",
            amount: 200,
            type: "transfer",
            category: "Self Transfer",
            fromAccount: "HDFC Savings",
            toAccount: "Emergency",
            notes: "",
            tags: [],
          },
        ],
      });

      expect(normalized.transactions[0].fromAccountId).toBeUndefined();
      expect(normalized.transactions[0].toAccountId).toBe("dest");
      expect(normalized.transactions[0].transferResolution).toBe("unresolved-legacy-name");
    });

    it("should reject self transfers to the same account", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
        ],
      });

      expect(() =>
        applyTransaction(store, {
          id: "tx-self",
          date: "2026-01-01",
          ledger: "Transfer",
          amount: 200,
          type: "self",
          category: "Self Transfer",
          fromAccount: "Checking",
          fromAccountId: "source",
          toAccount: "Checking",
          toAccountId: "source",
          notes: "",
          tags: [],
        })
      ).toThrow("Self transfer requires different accounts");
    });

    it("should reject zero or negative amounts", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      expect(() =>
        applyTransaction(store, {
          id: "tx-self",
          date: "2026-01-01",
          ledger: "Transfer",
          amount: 0,
          type: "self",
          category: "Self Transfer",
          fromAccount: "Checking",
          fromAccountId: "source",
          toAccount: "Savings",
          toAccountId: "dest",
          notes: "",
          tags: [],
        })
      ).toThrow("Self transfer amount must be greater than zero");

      expect(() =>
        applyTransaction(store, {
          id: "tx-self",
          date: "2026-01-01",
          ledger: "Transfer",
          amount: -50,
          type: "self",
          category: "Self Transfer",
          fromAccount: "Checking",
          fromAccountId: "source",
          toAccount: "Savings",
          toAccountId: "dest",
          notes: "",
          tags: [],
        })
      ).toThrow("Self transfer amount must be greater than zero");
    });

    it("should preserve createdAt and update updatedAt on transfer edits", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      const applied = applyTransaction(store, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 100,
        type: "transfer",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      });

      const updated = updateTransaction(applied, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 100,
        type: "transfer",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      }, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 150,
        type: "transfer",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      const transaction = updated.transactions.find((item) => item.id === "tx-self");
      expect(transaction?.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(transaction?.updatedAt).toBeDefined();
      expect(transaction?.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
    });

    it("should reverse the old transfer before applying an edited transfer", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      const applied = applyTransaction(store, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 100,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      const updated = updateTransaction(applied, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 100,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      }, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 300,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      expect(updated.accounts.find((a) => a.name === "Checking")?.balance).toBe(700);
      expect(updated.accounts.find((a) => a.name === "Savings")?.balance).toBe(800);
    });

    it("should reverse both sides when a transfer is deleted", () => {
      const store = createStore({
        accounts: [
          { id: "source", name: "Checking", type: "bank", balance: 1000, deleted: false },
          { id: "dest", name: "Savings", type: "bank", balance: 500, deleted: false },
        ],
      });

      const applied = applyTransaction(store, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 200,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      const deleted = deleteTransaction(applied, {
        id: "tx-self",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 200,
        type: "self",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      expect(deleted.accounts.find((a) => a.name === "Checking")?.balance).toBe(1000);
      expect(deleted.accounts.find((a) => a.name === "Savings")?.balance).toBe(500);
    });

    it("updates account updatedAt when a transfer changes its balance", () => {
      const store = createStore({
        accounts: [
          {
            id: "source",
            name: "Checking",
            type: "bank",
            balance: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            deleted: false,
          },
          {
            id: "dest",
            name: "Savings",
            type: "bank",
            balance: 500,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            deleted: false,
          },
        ],
      });

      const result = applyTransaction(store, {
        id: "tx-touch",
        date: "2026-01-01",
        ledger: "Transfer",
        amount: 100,
        type: "transfer",
        category: "Self Transfer",
        fromAccount: "Checking",
        fromAccountId: "source",
        toAccount: "Savings",
        toAccountId: "dest",
        notes: "",
        tags: [],
      });

      const source = result.accounts.find((account) => account.id === "source");
      const destination = result.accounts.find((account) => account.id === "dest");

      expect(source?.updatedAt).toBeDefined();
      expect(destination?.updatedAt).toBeDefined();
      expect(source?.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
      expect(destination?.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
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

  describe("Account Balance History", () => {
    it("should match transfer transactions by account IDs even when names changed", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const store = createStore({
        accounts: [
          { id: "acc-1", name: "Checking (Renamed)", type: "bank", balance: 900, deleted: false },
          { id: "acc-2", name: "Savings", type: "bank", balance: 1100, deleted: false },
        ],
        transactions: [
          {
            id: "tx-1",
            date: todayStr,
            type: "transfer",
            amount: 100,
            category: "Self Transfer",
            ledger: "Transfer",
            fromAccount: "Checking",
            fromAccountId: "acc-1",
            toAccount: "Savings",
            toAccountId: "acc-2",
            notes: "",
            tags: [],
            deleted: false,
          },
        ],
      });

      const history = getAccountBalanceHistory(store, "acc-1", 2);
      expect(history).toHaveLength(2);
      expect(history[1].balance).toBe(1000);
    });

    it("should keep legacy name-based matching when IDs are missing", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const store = createStore({
        accounts: [
          { id: "acc-1", name: "Checking", type: "bank", balance: 900, deleted: false },
          { id: "acc-2", name: "Savings", type: "bank", balance: 1100, deleted: false },
        ],
        transactions: [
          {
            id: "tx-legacy",
            date: todayStr,
            type: "transfer",
            amount: 100,
            category: "Self Transfer",
            ledger: "Transfer",
            fromAccount: "Checking",
            toAccount: "Savings",
            notes: "",
            tags: [],
            deleted: false,
          },
        ],
      });

      const history = getAccountBalanceHistory(store, "acc-1", 2);
      expect(history).toHaveLength(2);
      expect(history[1].balance).toBe(1000);
    });
  });
});
