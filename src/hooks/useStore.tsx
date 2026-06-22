import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Transaction
// ─────────────────────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string;
  type: "in" | "out";
  amount: number;
  fromAccount?: string; // for Money Out
  toAccount?: string;   // for Money In
  fromCard?: string;    // for credit card payments
  toCard?: string;      // for credit card spending
  loanId?: string;      // for loan EMI
  ledger: string;       // description
  category: string;
  notes: string;
  tags: string[];
  deleted?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Account
// ─────────────────────────────────────────────────────────────────────────────
export interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "business" | "investments" | "insurance" | "other";
  balance: number;
  currency: string;
  deleted?: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Credit Card
// ─────────────────────────────────────────────────────────────────────────────
export interface CreditCard {
  id: string;
  name: string;
  provider: string; // "HDFC", "ICICI", etc.
  cardNumber: string; // masked: "****1234"
  creditLimit: number;
  outstanding: number;
  statementDate: number; // day of month (1-31)
  dueDate: number; // day of month
  lastStatementDate?: string;
  nextStatementDate?: string;
  nextDueDate?: string;
  deleted?: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loan
// ─────────────────────────────────────────────────────────────────────────────
export interface Loan {
  id: string;
  name: string;
  lender: string; // "Bank", "NBFC", "Personal", etc.
  principal: number;
  interestRate: number; // annual percentage
  emiAmount: number;
  emiFrequency: "monthly" | "quarterly";
  emiCount: number; // total EMIs
  paidCount: number; // EMIs paid so far
  outstanding: number;
  startDate: string;
  nextEmiDate?: string;
  endDate?: string;
  deleted?: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  type: "in" | "out";
  icon?: string;
  color?: string;
  deleted?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag
// ─────────────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
export interface Settings {
  currency: string;
  dateFormat: string;
  language: string;
  theme: "light" | "dark";
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "manual";
  lastBackupTime?: string;
  pinLocked: boolean;
  pinHash?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup
// ─────────────────────────────────────────────────────────────────────────────
export interface Backup {
  id: string;
  timestamp: string;
  label: string;
  type: "manual" | "automatic";
  size: number; // bytes
  encrypted: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recycle Bin Item
// ─────────────────────────────────────────────────────────────────────────────
export interface RecycleBinItem {
  id: string;
  type: "transaction" | "account" | "creditCard" | "loan";
  data: any;
  deletedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export interface Store {
  // Core data
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  loans: Loan[];

  // Metadata
  categories: Category[];
  tags: Tag[];
  settings: Settings;

  // Backup & Recovery
  backups: Backup[];
  recycleBin: RecycleBinItem[];

  // Metadata
  version: number;
  lastModified: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Income", type: "in", color: "#34d399" },
  { id: "2", name: "Salary", type: "in", color: "#34d399" },
  { id: "3", name: "Investment Returns", type: "in", color: "#34d399" },
  { id: "4", name: "Bonus", type: "in", color: "#34d399" },
  { id: "5", name: "Food & Dining", type: "out", color: "#f97316" },
  { id: "6", name: "Travel", type: "out", color: "#06b6d4" },
  { id: "7", name: "Shopping", type: "out", color: "#ec4899" },
  { id: "8", name: "Bills & Utilities", type: "out", color: "#8b5cf6" },
  { id: "9", name: "Entertainment", type: "out", color: "#eab308" },
  { id: "10", name: "Healthcare", type: "out", color: "#ef4444" },
  { id: "11", name: "Loan Payment", type: "out", color: "#6366f1" },
  { id: "12", name: "Transfer", type: "out", color: "#6b7280" },
];

const DEFAULT_TAGS: Tag[] = [
  { id: "1", name: "Business", color: "#3b82f6" },
  { id: "2", name: "Personal", color: "#8b5cf6" },
  { id: "3", name: "Tax", color: "#f59e0b" },
  { id: "4", name: "Travel", color: "#06b6d4" },
  { id: "5", name: "Medical", color: "#ef4444" },
];

const DEFAULT_SETTINGS: Settings = {
  currency: "₹",
  dateFormat: "dd/MM/yyyy",
  language: "en",
  theme: "dark",
  autoBackup: true,
  backupFrequency: "daily",
  pinLocked: false,
};

const INITIAL_DATA: Store = {
  transactions: [],
  accounts: [
    { id: "1", name: "Esaf Bank (C)", type: "bank", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
    { id: "2", name: "Esaf Bank (S)", type: "bank", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
    { id: "3", name: "CSB Bank (S)", type: "bank", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
    { id: "4", name: "HDFC Bank (S)", type: "bank", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
    { id: "5", name: "Federal Bank (S)", type: "bank", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
    { id: "6", name: "Cash in hand", type: "cash", balance: 0, currency: "₹", createdAt: new Date().toISOString() },
  ],
  creditCards: [],
  loans: [],
  categories: DEFAULT_CATEGORIES,
  tags: DEFAULT_TAGS,
  settings: DEFAULT_SETTINGS,
  backups: [],
  recycleBin: [],
  version: 2,
  lastModified: new Date().toISOString(),
};

const STORE_KEY = "moneymind-data-v2";

interface StoreContextType {
  store: Store;
  updateStore: (updater: (prev: Store) => Store) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => {
    try {
      const item = window.localStorage.getItem(STORE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        // Merge with defaults to handle missing fields
        return {
          ...INITIAL_DATA,
          ...parsed,
          version: 2,
          lastModified: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error("Failed to load store from localStorage:", e);
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error("Failed to save store to localStorage:", e);
    }
  }, [store]);

  const updateStore = (updater: (prev: Store) => Store) => {
    setStore((prev) => ({
      ...updater(prev),
      lastModified: new Date().toISOString(),
    }));
  };

  return (
    <StoreContext.Provider value={{ store, updateStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

// Helper functions
export function getTransactionById(store: Store, id: string): Transaction | undefined {
  return store.transactions.find((t) => t.id === id && !t.deleted);
}

export function getAccountById(store: Store, id: string): Account | undefined {
  return store.accounts.find((a) => a.id === id && !a.deleted);
}

export function getCreditCardById(store: Store, id: string): CreditCard | undefined {
  return store.creditCards.find((c) => c.id === id && !c.deleted);
}

export function getLoanById(store: Store, id: string): Loan | undefined {
  return store.loans.find((l) => l.id === id && !l.deleted);
}

export function getCategoryByName(store: Store, name: string): Category | undefined {
  return store.categories.find((c) => c.name === name && !c.deleted);
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPATIBILITY EXPORTS (for gradual migration)
// These interfaces are deprecated but exported for components still using old structure
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use Transaction instead */
export interface LiabilityItem {
  id: string;
  group: string;
  name: string;
  amount: number;
  dueDate: string;
  deleted?: boolean;
}

/** @deprecated Use Loan instead */
export interface LendItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  deleted?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION HELPERS (for gradual transition from old to new store)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all accounts in old format (with 'group' field for compatibility)
 */
export function getAccountsLegacyFormat(store: Store): Array<any> {
  return store.accounts.map((a) => ({
    ...a,
    group: a.type === "bank" || a.type === "cash" ? "accounts" : "other",
  }));
}

/**
 * Get credit card liabilities in old format for compatibility
 */
export function getCreditCardLiabilitiesLegacy(store: Store): LiabilityItem[] {
  return store.creditCards
    .filter((c) => !c.deleted)
    .map((c) => ({
      id: c.id,
      group: "Credit Cards",
      name: c.name,
      amount: c.outstanding,
      dueDate: c.nextDueDate || "",
      deleted: c.deleted,
    }));
}

/**
 * Get loan liabilities in old format for compatibility
 */
export function getLoanLiabilitiesLegacy(store: Store): LiabilityItem[] {
  return store.loans
    .filter((l) => !l.deleted)
    .map((l) => ({
      id: l.id,
      group: "Loan & EMI",
      name: l.name,
      amount: l.outstanding,
      dueDate: l.nextEmiDate || "",
      deleted: l.deleted,
    }));
}
