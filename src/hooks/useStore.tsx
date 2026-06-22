import React, { createContext, useContext, useEffect, useState } from "react";

export type TransactionType = "in" | "out";

export interface Transaction {
  id: string;
  date: string;
  ledger: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  fromAccount?: string;
  toAccount?: string;
  notes?: string;
  tags?: string[];
  deleted?: boolean;
}

export type AccountType =
  | "cash"
  | "bank"
  | "business"
  | "investment"
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
  creditLimit: number;
  outstanding: number;
  statementDate: string;
  dueDate: string;
  deleted?: boolean;
}

export interface Loan {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  emi: number;
  outstanding: number;
  remainingMonths: number;
  startDate: string;
  nextEmiDate: string;
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
      creditLimit: 0,
      outstanding: 0,
      statementDate: "",
      dueDate: "",
    },
    {
      id: "hdfc-money-back",
      name: "HDFC Money Back",
      creditLimit: 0,
      outstanding: 0,
      statementDate: "",
      dueDate: "",
    },
    {
      id: "axis-neo",
      name: "AXIS Neo",
      creditLimit: 0,
      outstanding: 0,
      statementDate: "",
      dueDate: "",
    },
    {
      id: "axis-my-zone",
      name: "AXIS My Zone",
      creditLimit: 0,
      outstanding: 0,
      statementDate: "",
      dueDate: "",
    },
  ],
  loans: [
    {
      id: "cred-personal-loan-1",
      name: "Cred Personal Loan 1",
      principal: 0,
      interestRate: 0,
      emi: 0,
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
    },
    {
      id: "cred-personal-loan-2",
      name: "Cred Personal Loan 2",
      principal: 0,
      interestRate: 0,
      emi: 0,
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
    },
    {
      id: "bajaj-loan-emi",
      name: "Bajaj Loan EMI",
      principal: 0,
      interestRate: 0,
      emi: 0,
      outstanding: 0,
      remainingMonths: 0,
      startDate: "",
      nextEmiDate: "",
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

function normalizeStore(parsed: Partial<Store>): Store {
  return {
    ...INITIAL_DATA,
    ...parsed,
    transactions: parsed.transactions ?? [],
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