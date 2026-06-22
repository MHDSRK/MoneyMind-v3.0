import { useEffect, useState } from "react";

export interface Transaction {
  id: string;
  date: string;
  ledger: string;
  amount: number;
  type: "in" | "out";
  category: string;
  account: string;
  notes?: string;
  tags?: string[];
}

export interface Account {
  name: string;
  group: "accounts" | "credit-cards";
  balance: number;
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

export interface Store {
  transactions: Transaction[];
  accounts: Account[];
  liabilities: LiabilityItem[];
  lends: LendItem[];
}

const INITIAL_DATA: Store = {
  transactions: [],
  accounts: [
    { name: "Esaf Bank (C)", group: "accounts", balance: 0 },
    { name: "Esaf Bank (S)", group: "accounts", balance: 0 },
    { name: "CSB Bank (S)", group: "accounts", balance: 0 },
    { name: "HDFC Bank (S)", group: "accounts", balance: 0 },
    { name: "Federal Bank (S)", group: "accounts", balance: 0 },
    { name: "Cash in hand", group: "accounts", balance: 0 },

    { name: "SBI octane", group: "credit-cards", balance: 0 },
    { name: "HDFC Money Back", group: "credit-cards", balance: 0 },
    { name: "AXIS Neo", group: "credit-cards", balance: 0 },
    { name: "AXIS My Zone", group: "credit-cards", balance: 0 },
  ],
  liabilities: [
    { id: "1", group: "Credit Cards", name: "SBI octane", amount: 0, dueDate: "" },
    { id: "2", group: "Credit Cards", name: "HDFC Money Back", amount: 0, dueDate: "" },
    { id: "3", group: "Credit Cards", name: "AXIS Neo", amount: 0, dueDate: "" },
    { id: "4", group: "Credit Cards", name: "AXIS My Zone", amount: 0, dueDate: "" },

    { id: "5", group: "Loan & EMI", name: "Cred Personal Loan 1", amount: 0, dueDate: "" },
    { id: "6", group: "Loan & EMI", name: "Cred Personal Loan 2", amount: 0, dueDate: "" },
    { id: "7", group: "Loan & EMI", name: "Bajaj Loan EMI", amount: 0, dueDate: "" },

    { id: "8", group: "Chitty", name: "Local Chitty", amount: 0, dueDate: "" },
    { id: "9", group: "Chitty", name: "Bank Chitty", amount: 0, dueDate: "" },

    { id: "10", group: "Regular Expenses", name: "Home Expense", amount: 0, dueDate: "" },
    { id: "11", group: "Regular Expenses", name: "House Rent", amount: 0, dueDate: "" },
    { id: "12", group: "Regular Expenses", name: "Daughter School Fee", amount: 0, dueDate: "" },
  ],
  lends: [],
};

const STORE_KEY = "moneymind-data";

function loadStore(): Store {
  try {
    const item = window.localStorage.getItem(STORE_KEY);

    if (!item) {
      return INITIAL_DATA;
    }

    const parsed = JSON.parse(item) as Partial<Store>;

    return {
      ...INITIAL_DATA,
      ...parsed,
      transactions: parsed.transactions ?? [],
      accounts: parsed.accounts ?? INITIAL_DATA.accounts,
      liabilities: parsed.liabilities ?? INITIAL_DATA.liabilities,
      lends: parsed.lends ?? [],
    };
  } catch (error) {
    console.error("Failed to load MoneyMind data:", error);
    return INITIAL_DATA;
  }
}

export function useStore() {
  const [store, setStore] = useState<Store>(() => loadStore());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to save MoneyMind data:", error);
    }
  }, [store]);

  const updateStore = (updater: (prev: Store) => Store) => {
    setStore((prev) => updater(prev));
  };

  return { store, updateStore };
}