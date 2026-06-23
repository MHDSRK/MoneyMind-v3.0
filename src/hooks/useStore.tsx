import React, { createContext, useContext, useEffect, useState } from "react";
import * as backupService from "@/lib/backupService";

export type TransactionType = "in" | "out";

export interface Transaction {
  id: string;
  date: string;
  ledger: string;
  amount: number;
  type: TransactionType;
  category: string;
  account?: string;
  fromAccount?: string;
  toAccount?: string;
  notes: string;
  tags: string[];
  deleted?: boolean;
}

export type AccountType =
  | "cash"
  | "bank"
  | "business"
  | "investment"
  | "investments"
  | "insurance"
  | "other";

export interface Account {
  id?: string;
  name: string;
  type?: AccountType;
  group?: "accounts" | "credit-cards";
  balance: number;
  deleted?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  provider: string;
  cardType?: string;
  cardNumber?: string;
  creditLimit: number;
  outstanding: number;
  unbilled?: number;
  statementDate: number;
  dueDate: number;
  nextDueDate: string;
  createdAt: string;
  deleted?: boolean;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  principal: number;
  interestRate: number;
  emi?: number;
  emiAmount: number;
  emiCount: number;
  paidCount: number;
  emiFrequency: "monthly" | "weekly" | "yearly";
  outstanding: number;
  remainingMonths?: number;
  startDate: string;
  nextEmiDate: string;
  createdAt: string;
  deleted?: boolean;
}

export interface LiabilityItem {
  id: string;
  group: string;
  name: string;
  amount: number;
  dueDate: string;
  deleted?: boolean;
}

export interface LendItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  deleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  deleted?: boolean;
}

export interface Store {
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  loans: Loan[];
  liabilities: LiabilityItem[];
  lends: LendItem[];
  categories: Category[];
}

const INITIAL_DATA: Store = {
  transactions: [],
  accounts: [
    { id: "cash-in-hand", name: "Cash in hand", type: "cash", group: "accounts", balance: 0 },
    { id: "esaf-bank-c", name: "Esaf Bank (C)", type: "bank", group: "accounts", balance: 0 },
    { id: "esaf-bank-s", name: "Esaf Bank (S)", type: "bank", group: "accounts", balance: 0 },
    { id: "csb-bank-s", name: "CSB Bank (S)", type: "bank", group: "accounts", balance: 0 },
    { id: "hdfc-bank-s", name: "HDFC Bank (S)", type: "bank", group: "accounts", balance: 0 },
    { id: "federal-bank-s", name: "Federal Bank (S)", type: "bank", group: "accounts", balance: 0 },
  ],
  creditCards: [
    {
      id: "sbi-octane",
      name: "SBI octane",
      provider: "SBI",
      creditLimit: 0,
      outstanding: 0,
      statementDate: 1,
      dueDate: 20,
      nextDueDate: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "hdfc-money-back",
      name: "HDFC Money Back",
      provider: "HDFC",
      creditLimit: 0,
      outstanding: 0,
      statementDate: 1,
      dueDate: 20,
      nextDueDate: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "axis-neo",
      name: "AXIS Neo",
      provider: "AXIS",
      creditLimit: 0,
      outstanding: 0,
      statementDate: 1,
      dueDate: 20,
      nextDueDate: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "axis-my-zone",
      name: "AXIS My Zone",
      provider: "AXIS",
      creditLimit: 0,
      outstanding: 0,
      statementDate: 1,
      dueDate: 20,
      nextDueDate: "",
      createdAt: new Date().toISOString(),
    },
  ],
  loans: [
    {
      id: "cred-personal-loan-1",
      name: "Cred Personal Loan 1",
      lender: "Cred",
      principal: 0,
      interestRate: 0,
      emi: 0,
      emiAmount: 0,
      emiCount: 0,
      paidCount: 0,
      emiFrequency: "monthly",
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "cred-personal-loan-2",
      name: "Cred Personal Loan 2",
      lender: "Cred",
      principal: 0,
      interestRate: 0,
      emi: 0,
      emiAmount: 0,
      emiCount: 0,
      paidCount: 0,
      emiFrequency: "monthly",
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "bajaj-loan-emi",
      name: "Bajaj Loan EMI",
      lender: "Bajaj",
      principal: 0,
      interestRate: 0,
      emi: 0,
      emiAmount: 0,
      emiCount: 0,
      paidCount: 0,
      emiFrequency: "monthly",
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
      createdAt: new Date().toISOString(),
    },
  ],
  liabilities: [
    { id: "cc-sbi-octane", group: "Credit Cards", name: "SBI octane", amount: 0, dueDate: "" },
    { id: "cc-hdfc-money-back", group: "Credit Cards", name: "HDFC Money Back", amount: 0, dueDate: "" },
    { id: "cc-axis-neo", group: "Credit Cards", name: "AXIS Neo", amount: 0, dueDate: "" },
    { id: "cc-axis-my-zone", group: "Credit Cards", name: "AXIS My Zone", amount: 0, dueDate: "" },
    { id: "loan-cred-1", group: "Loan & EMI", name: "Cred Personal Loan 1", amount: 0, dueDate: "" },
    { id: "loan-cred-2", group: "Loan & EMI", name: "Cred Personal Loan 2", amount: 0, dueDate: "" },
    { id: "loan-bajaj", group: "Loan & EMI", name: "Bajaj Loan EMI", amount: 0, dueDate: "" },
    { id: "chitty-local", group: "Chitty", name: "Local Chitty", amount: 0, dueDate: "" },
    { id: "chitty-bank", group: "Chitty", name: "Bank Chitty", amount: 0, dueDate: "" },
    { id: "home-expense", group: "Regular Expenses", name: "Home Expense", amount: 0, dueDate: "" },
    { id: "house-rent", group: "Regular Expenses", name: "House Rent", amount: 0, dueDate: "" },
    { id: "school-fee", group: "Regular Expenses", name: "Daughter School Fee", amount: 0, dueDate: "" },
  ],
  lends: [],
  categories: [
    { id: "income", name: "Income", type: "in" },
    { id: "borrow", name: "Borrow", type: "in" },
    { id: "repayment-in", name: "Repayment", type: "in" },
    { id: "company-in", name: "Company", type: "in" },
    { id: "home-expenses", name: "Home Expenses", type: "out" },
    { id: "lent", name: "Lent", type: "out" },
    { id: "repayment-out", name: "Repayment", type: "out" },
    { id: "company-out", name: "Company", type: "out" },
    { id: "business", name: "Business", type: "out" },
    { id: "personal", name: "Personal", type: "out" },
    { id: "tax", name: "Tax", type: "out" },
    { id: "travel", name: "Travel", type: "out" },
    { id: "medical", name: "Medical", type: "out" },
    { id: "others", name: "Others", type: "out" },
  ],
};

const STORE_KEY = "moneymind-data";

interface StoreContextValue {
  store: Store;
  updateStore: (updater: (prev: Store) => Store) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function normalizeTransaction(transaction: Partial<Transaction>): Transaction {
  return {
    id: transaction.id ?? crypto.randomUUID(),
    date: transaction.date ?? new Date().toISOString(),
    ledger: transaction.ledger ?? "",
    amount: transaction.amount ?? 0,
    type: transaction.type ?? "out",
    category: transaction.category ?? "",
    account: transaction.account ?? transaction.fromAccount ?? transaction.toAccount ?? "",
    fromAccount: transaction.fromAccount,
    toAccount: transaction.toAccount,
    notes: transaction.notes ?? "",
    tags: transaction.tags ?? [],
    deleted: transaction.deleted ?? false,
  };
}

function normalizeStore(parsed: Partial<Store>): Store {
  return {
    ...INITIAL_DATA,
    ...parsed,
    transactions: (parsed.transactions ?? []).map(normalizeTransaction),
    accounts: parsed.accounts ?? INITIAL_DATA.accounts,
    creditCards: parsed.creditCards ?? INITIAL_DATA.creditCards,
    loans: parsed.loans ?? INITIAL_DATA.loans,
    liabilities: parsed.liabilities ?? INITIAL_DATA.liabilities,
    lends: parsed.lends ?? [],
    categories: parsed.categories ?? INITIAL_DATA.categories,
  };
}

function loadStore(): Store {
  try {
    const item = window.localStorage.getItem(STORE_KEY);

    if (!item) {
      return INITIAL_DATA;
    }

    const parsed = JSON.parse(item) as Partial<Store>;
    return normalizeStore(parsed);
  } catch (error) {
    console.error("Failed to load MoneyMind data:", error);
    return INITIAL_DATA;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to save MoneyMind data:", error);
    }
  }, [store]);

  // Auto-backup logic
  useEffect(() => {
    if (!backupService.isAutoBackupEnabled()) return;
    if (!backupService.shouldRunAutoBackup()) return;

    try {
      backupService.createBackup(store);
      backupService.recordAutoBackupTime();
      console.log("Auto-backup completed successfully");
    } catch (error) {
      console.error("Auto-backup failed:", error);
    }
  }, [store]);

  const updateStore = (updater: (prev: Store) => Store) => {
    setStore((prev) => normalizeStore(updater(prev)));
  };

  return (
    <StoreContext.Provider value={{ store, updateStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (context) {
    return context;
  }

  const [store, setStore] = useState<Store>(() => loadStore());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to save MoneyMind data:", error);
    }
  }, [store]);

  const updateStore = (updater: (prev: Store) => Store) => {
    setStore((prev) => normalizeStore(updater(prev)));
  };

  return { store, updateStore };
}