import { useState, useEffect } from "react";

export interface Transaction {
  id: string;
  date: string;
  ledger: string;
  amount: number;
  type: "in" | "out";
  category: string;
  account: string;
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
    { name: "HDFC Moneyback", group: "credit-cards", balance: 0 },
    { name: "Axis Rupay", group: "credit-cards", balance: 0 },
    { name: "Axis Neo", group: "credit-cards", balance: 0 }
  ],
  liabilities: [
    { id: "1", group: "Credit Cards", name: "SBI octane", amount: 0, dueDate: "" },
    { id: "2", group: "Credit Cards", name: "HDFC Moneyback", amount: 0, dueDate: "" },
    { id: "3", group: "Credit Cards", name: "Axis Rupay", amount: 0, dueDate: "" },
    { id: "4", group: "Credit Cards", name: "Axis Neo", amount: 0, dueDate: "" },
    { id: "5", group: "Loan & EMI", name: "Cred Personal Loan 1", amount: 0, dueDate: "" },
    { id: "6", group: "Loan & EMI", name: "Cred Personal Loan 2", amount: 0, dueDate: "" },
    { id: "7", group: "Loan & EMI", name: "Bajaj Loan EMI", amount: 0, dueDate: "" },
    { id: "8", group: "Chitty", name: "Local Chitty", amount: 0, dueDate: "" },
    { id: "9", group: "Chitty", name: "Bank Chitty", amount: 0, dueDate: "" },
    { id: "10", group: "Regular Expenses", name: "Home Expense", amount: 0, dueDate: "" },
    { id: "11", group: "Regular Expenses", name: "House Rent", amount: 0, dueDate: "" },
    { id: "12", group: "Regular Expenses", name: "Daughter School Fee", amount: 0, dueDate: "" }
  ],
  lends: []
};

const STORE_KEY = "moneymind-data";

export function useStore() {
  const [store, setStore] = useState<Store>(() => {
    try {
      const item = window.localStorage.getItem(STORE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        return { ...INITIAL_DATA, ...parsed, lends: parsed.lends ?? [] };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error(e);
    }
  }, [store]);

  const updateStore = (updater: (prev: Store) => Store) => {
    setStore((prev) => updater(prev));
  };

  return { store, updateStore };
}
