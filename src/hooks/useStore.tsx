import React, { createContext, useContext, useEffect, useState } from "react";
import * as backupService from "@/lib/backupService";

export type TransactionType = "in" | "out" | "transfer";

export function normalizeTransactionType(type?: string): TransactionType {
  if (type === "transfer" || type === "self") return "transfer";
  if (type === "in" || type === "out") return type;
  return "out";
}

export interface Transaction {
  id: string;
  date: string;
  ledger: string;
  amount: number;
  type: TransactionType;
  category: string;
  account?: string;
  fromAccount?: string;
  fromAccountId?: string;
  fromCardId?: string;
  toAccount?: string;
  toAccountId?: string;
  toCardId?: string;
  transferResolution?: "resolved" | "unresolved-legacy-name";
  notes: string;
  tags: string[];
  relatedEntityType?: "loan" | "credit-card" | "liability";
  relatedEntityId?: string;
  deleted?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
  id: string;
  name: string;
  type?: AccountType;
  group?: "accounts" | "credit-cards";
  balance: number;
  deleted?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  archivedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  archivedAt?: string;
}

export interface LiabilityItem {
  id: string;
  group: string;
  name: string;
  amount: number;
  dueDate: string;
  deleted?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LendItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  deleted?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
    },
    {
      id: "hdfc-personal-loan",
      name: "HDFC Personal Loan",
      lender: "HDFC",
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
    },
  ],
  liabilities: [
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

function createTimestamp() {
  return new Date().toISOString();
}

function withTimestamps<T extends { createdAt?: string; updatedAt?: string }>(value: T): T {
  const createdAt = value.createdAt ?? createTimestamp();
  return {
    ...value,
    createdAt,
    updatedAt: value.updatedAt ?? createdAt,
  };
}

interface StoreContextValue {
  store: Store;
  updateStore: (updater: (prev: Store) => Store) => void;
}

function touch<T extends { updatedAt?: string }>(item: T): T {
  return {
    ...item,
    updatedAt: createTimestamp(),
  };
}

function updateRecord<T extends { createdAt?: string; updatedAt?: string }>(
  item: T,
  changes: Partial<T>
): T {
  return {
    ...item,
    ...changes,
    createdAt: item.createdAt,
    updatedAt: createTimestamp(),
  };
}

export function updateAccount(store: Store, accountId: string, changes: Partial<Account>): Store {
  return {
    ...store,
    accounts: store.accounts.map((account) =>
      account.id === accountId ? updateRecord(account, changes) : account
    ),
  };
}

export function updateCreditCard(store: Store, cardId: string, changes: Partial<CreditCard>): Store {
  return {
    ...store,
    creditCards: store.creditCards.map((card) =>
      card.id === cardId ? updateRecord(card, changes) : card
    ),
  };
}

export function updateLoan(store: Store, loanId: string, changes: Partial<Loan>): Store {
  return {
    ...store,
    loans: store.loans.map((loan) =>
      loan.id === loanId ? updateRecord(loan, changes) : loan
    ),
  };
}

export function updateLiability(store: Store, liabilityId: string, changes: Partial<LiabilityItem>): Store {
  return {
    ...store,
    liabilities: store.liabilities.map((item) =>
      item.id === liabilityId ? updateRecord(item, changes) : item
    ),
  };
}

export function archiveRecord<T extends { id: string; archivedAt?: string; updatedAt?: string }>(
  items: T[],
  id: string
): T[] {
  const archivedAt = new Date().toISOString();
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          archivedAt,
          updatedAt: archivedAt,
        }
      : item
  );
}

export function restoreRecord<
  T extends { id: string; archivedAt?: string; updatedAt?: string }
>(items: T[], id: string): T[] {
  const updatedAt = new Date().toISOString();

  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          archivedAt: undefined,
          updatedAt,
        }
      : item
  );
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function normalizeAccountReference(value?: string) {
  return value?.replace(/^account:/, "").replace(/^card:/, "");
}

function resolveUniqueAccountIdByName(accounts: Account[], accountName?: string) {
  if (!accountName) return undefined;

  const matches = accounts.filter((account) => !account.deleted && !account.archivedAt && account.name === accountName);
  return matches.length === 1 ? matches[0].id : undefined;
}

function normalizeTransaction(transaction: Partial<Transaction>, accounts: Account[]): Transaction {
  const normalizedType = normalizeTransactionType(transaction.type);
  let normalizedFromAccountId = normalizeAccountReference(transaction.fromAccountId);
  let normalizedToAccountId = normalizeAccountReference(transaction.toAccountId);
  const normalizedFromCardId = normalizeAccountReference(transaction.fromCardId);
  const normalizedToCardId = normalizeAccountReference(transaction.toCardId);
  let transferResolution: Transaction["transferResolution"];

  if (normalizedType === "transfer") {
    normalizedFromAccountId = normalizedFromAccountId ?? resolveUniqueAccountIdByName(accounts, transaction.fromAccount);
    normalizedToAccountId = normalizedToAccountId ?? resolveUniqueAccountIdByName(accounts, transaction.toAccount);
    transferResolution = normalizedFromAccountId && normalizedToAccountId
      ? "resolved"
      : "unresolved-legacy-name";
  }

  return withTimestamps({
    id: transaction.id ?? crypto.randomUUID(),
    date: transaction.date ?? new Date().toISOString(),
    ledger: transaction.ledger ?? "",
    amount: transaction.amount ?? 0,
    type: normalizedType,
    category: transaction.category ?? "",
    account: transaction.account ?? transaction.fromAccount ?? transaction.toAccount ?? "",
    fromAccount: transaction.fromAccount,
    fromAccountId: normalizedFromAccountId,
    fromCardId: normalizedFromCardId,
    toAccount: transaction.toAccount,
    toAccountId: normalizedToAccountId,
    toCardId: normalizedToCardId,
    transferResolution,
    notes: transaction.notes ?? "",
    tags: transaction.tags ?? [],
    deleted: transaction.deleted ?? false,
    archivedAt: transaction.archivedAt,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  });
}

function normalizeAccount(account: Partial<Account>): Account {
  const normalizedType = account.type === "investment" ? "investments" : account.type;

  return withTimestamps({
    id: account.id ?? crypto.randomUUID(),
    name: account.name ?? "",
    type: normalizedType,
    group: account.group,
    balance: account.balance ?? 0,
    deleted: account.deleted ?? false,
    archivedAt: account.archivedAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  });
}

function normalizeCreditCard(card: Partial<CreditCard>): CreditCard {
  return withTimestamps({
    id: card.id ?? crypto.randomUUID(),
    name: card.name ?? "",
    provider: card.provider ?? "",
    cardType: card.cardType,
    cardNumber: card.cardNumber,
    creditLimit: card.creditLimit ?? 0,
    outstanding: card.outstanding ?? 0,
    unbilled: card.unbilled ?? 0,
    statementDate: card.statementDate ?? 1,
    dueDate: card.dueDate ?? 15,
    nextDueDate: card.nextDueDate ?? new Date().toISOString(),
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    deleted: card.deleted ?? false,
    archivedAt: card.archivedAt,
  });
}

function normalizeLoan(loan: Partial<Loan>): Loan {
  return withTimestamps({
    id: loan.id ?? crypto.randomUUID(),
    name: loan.name ?? "",
    lender: loan.lender ?? "",
    principal: loan.principal ?? 0,
    interestRate: loan.interestRate ?? 0,
    emi: loan.emi,
    emiAmount: loan.emiAmount ?? 0,
    emiCount: loan.emiCount ?? 0,
    paidCount: loan.paidCount ?? 0,
    emiFrequency: loan.emiFrequency ?? "monthly",
    outstanding: loan.outstanding ?? 0,
    remainingMonths: loan.remainingMonths,
    startDate: loan.startDate ?? "",
    nextEmiDate: loan.nextEmiDate ?? "",
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    deleted: loan.deleted ?? false,
    archivedAt: loan.archivedAt,
  });
}

function normalizeLiability(item: Partial<LiabilityItem>): LiabilityItem {
  return withTimestamps({
    id: item.id ?? crypto.randomUUID(),
    group: item.group ?? "",
    name: item.name ?? "",
    amount: item.amount ?? 0,
    dueDate: item.dueDate ?? "",
    deleted: item.deleted ?? false,
    archivedAt: item.archivedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

function normalizeLendItem(item: Partial<LendItem>): LendItem {
  return withTimestamps({
    id: item.id ?? crypto.randomUUID(),
    name: item.name ?? "",
    amount: item.amount ?? 0,
    date: item.date ?? "",
    deleted: item.deleted ?? false,
    archivedAt: item.archivedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

function normalizeCategory(category: Partial<Category>): Category {
  return withTimestamps({
    id: category.id ?? crypto.randomUUID(),
    name: category.name ?? "",
    type: category.type ?? "out",
    deleted: category.deleted ?? false,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  });
}

export function normalizeStore(parsed: Partial<Store>): Store {
  const accounts = (parsed.accounts ?? INITIAL_DATA.accounts).map(normalizeAccount);

  return {
    ...INITIAL_DATA,
    ...parsed,
    transactions: (parsed.transactions ?? []).map((transaction) => normalizeTransaction(transaction, accounts)),
    accounts,
    creditCards: (parsed.creditCards ?? INITIAL_DATA.creditCards).map(normalizeCreditCard),
    loans: (parsed.loans ?? INITIAL_DATA.loans).map(normalizeLoan),
    liabilities: (parsed.liabilities ?? INITIAL_DATA.liabilities).map(normalizeLiability),
    lends: (parsed.lends ?? []).map(normalizeLendItem),
    categories: (parsed.categories ?? INITIAL_DATA.categories).map(normalizeCategory),
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

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}