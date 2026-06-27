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
  isArchived?: boolean;
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
  isArchived?: boolean;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  tag?: string;
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
  isArchived?: boolean;
}

export interface LiabilityItem {
  id: string;
  group: string;
  name: string;
  amount: number;
  dueDate: string;
  deleted?: boolean;
  archivedAt?: string;
  isArchived?: boolean;
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
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type HistoryEventType = "create" | "edit" | "archive" | "restore" | "delete";
export type HistoryEventEntityType =
  | "account"
  | "credit-card"
  | "loan"
  | "liability"
  | "transaction"
  | "category"
  | "lend";

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  entityType: HistoryEventEntityType;
  entityId: string;
  entityName: string;
  timestamp: string;
  details?: string;
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
  history: HistoryEvent[];
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
  history: [],
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

type TrackableItem = { id: string; deleted?: boolean; archivedAt?: string; createdAt?: string; updatedAt?: string; isArchived?: boolean };

function createHistoryEvent(event: Omit<HistoryEvent, "id" | "timestamp">): HistoryEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
    timestamp: createTimestamp(),
  };
}

function normalizeHistoryEvent(event: Partial<HistoryEvent>): HistoryEvent {
  return {
    id: event.id ?? crypto.randomUUID(),
    type: event.type ?? "edit",
    entityType: event.entityType ?? "transaction",
    entityId: event.entityId ?? "",
    entityName: event.entityName ?? "",
    timestamp: event.timestamp ?? createTimestamp(),
    details: event.details,
  };
}

function getComparableItem(item: TrackableItem) {
  const copy = { ...(item as Record<string, unknown>) };
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.archivedAt;
  delete copy.isArchived;
  delete copy.deleted;
  return copy;
}

function isEditedItem(prevItem: TrackableItem, nextItem: TrackableItem) {
  return JSON.stringify(getComparableItem(prevItem)) !== JSON.stringify(getComparableItem(nextItem));
}

function formatHistoryEntityName(item: Record<string, unknown>, entityType: HistoryEventEntityType) {
  if (typeof item.name === "string" && item.name.trim()) return item.name;
  if (entityType === "credit-card" && typeof item.provider === "string" && typeof item.name === "string") {
    return item.name ? `${item.name}` : item.provider;
  }
  if (entityType === "transaction") {
    const amount = typeof item.amount === "number" ? ` ${item.amount}` : "";
    const label = typeof item.category === "string" && item.category ? item.category : typeof item.ledger === "string" && item.ledger ? item.ledger : "Transaction";
    return `${label}${amount}`;
  }
  if (typeof item.account === "string" && item.account) return item.account;
  return String(item.id ?? "Unknown");
}

function buildHistoryEvents(prev: Store, next: Store): HistoryEvent[] {
  const events: HistoryEvent[] = [];

  const diffEntities = <T extends TrackableItem>(
    prevItems: T[],
    nextItems: T[],
    entityType: HistoryEventEntityType,
    detailsResolver?: (item: T) => string
  ) => {
    const prevMap = new Map(prevItems.map((item) => [item.id, item]));

    nextItems.forEach((nextItem) => {
      const prevItem = prevMap.get(nextItem.id);
      const entityName = formatHistoryEntityName(nextItem, entityType);
      const details = detailsResolver?.(nextItem);

      if (!prevItem) {
        if (!nextItem.deleted) {
          events.push(createHistoryEvent({
            type: "create",
            entityType,
            entityId: nextItem.id,
            entityName,
            details,
          }));
        }
        return;
      }

      if (!prevItem.deleted && nextItem.deleted) {
        events.push(createHistoryEvent({
          type: "delete",
          entityType,
          entityId: nextItem.id,
          entityName,
          details,
        }));
        return;
      }

      if (!prevItem.archivedAt && nextItem.archivedAt) {
        events.push(createHistoryEvent({
          type: "archive",
          entityType,
          entityId: nextItem.id,
          entityName,
          details,
        }));
        return;
      }

      if (prevItem.archivedAt && !nextItem.archivedAt) {
        events.push(createHistoryEvent({
          type: "restore",
          entityType,
          entityId: nextItem.id,
          entityName,
          details,
        }));
        return;
      }

      if (isEditedItem(prevItem, nextItem)) {
        events.push(createHistoryEvent({
          type: "edit",
          entityType,
          entityId: nextItem.id,
          entityName,
          details,
        }));
      }
    });
  };

  diffEntities(prev.accounts, next.accounts, "account");
  diffEntities(prev.creditCards, next.creditCards, "credit-card");
  diffEntities(prev.loans, next.loans, "loan");
  diffEntities(prev.liabilities, next.liabilities, "liability");
  diffEntities(prev.transactions, next.transactions, "transaction", (item) => {
    const amount = typeof item.amount === "number" ? `${item.amount}` : "";
    return `${item.type} ${amount}`;
  });
  diffEntities(prev.categories, next.categories, "category");
  diffEntities(prev.lends, next.lends, "lend");

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

export function updateCreditCardUnbilled(store: Store, cardId: string, newUnbilled: number): Store {
  return {
    ...store,
    creditCards: store.creditCards.map((card) =>
      card.id === cardId
        ? updateRecord(card, { unbilled: Math.max(0, newUnbilled) })
        : card
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

function touchAccountBalance(account: Account, balance: number): Account {
  return {
    ...account,
    balance,
    updatedAt: new Date().toISOString(),
  };
}

function touchCardBalance(
  card: CreditCard,
  changes: Pick<CreditCard, "outstanding" | "unbilled">
): CreditCard {
  return {
    ...card,
    ...changes,
    updatedAt: new Date().toISOString(),
  };
}

function applyTransactionEffectsToStore(store: Store, transaction: Transaction, direction: 1 | -1): Store {
  const amount = Number(transaction.amount ?? 0);
  const normalizedType = normalizeTransactionType(transaction.type);
  const normalizedTransaction = {
    ...transaction,
    amount,
    type: normalizedType,
    fromAccount: transaction.fromAccount,
    fromAccountId: transaction.fromAccountId,
    fromCardId: transaction.fromCardId,
    toAccount: transaction.toAccount,
    toAccountId: transaction.toAccountId,
    toCardId: transaction.toCardId,
    ledger: transaction.ledger ?? "",
    category: transaction.category ?? "",
    notes: transaction.notes ?? "",
    tags: transaction.tags ?? [],
  } as Transaction;

  if (!Number.isFinite(amount) || amount <= 0) {
    return store;
  }

  let nextStore = { ...store };

  if (normalizedTransaction.type === "transfer") {
    const fromAccountId = normalizeAccountReference(normalizedTransaction.fromAccountId);
    const toAccountId = normalizeAccountReference(normalizedTransaction.toAccountId);

    if (!fromAccountId || !toAccountId) {
      return store;
    }

    const fromAccount = nextStore.accounts.find(
      (account) => !account.deleted && !account.archivedAt && account.id === fromAccountId
    );
    const toAccount = nextStore.accounts.find(
      (account) => !account.deleted && !account.archivedAt && account.id === toAccountId
    );

    if (!fromAccount || !toAccount) {
      return store;
    }

    nextStore = {
      ...nextStore,
      accounts: nextStore.accounts.map((account) => {
        if (account.id === fromAccount.id) {
          return touchAccountBalance(account, account.balance - amount * direction);
        }
        if (account.id === toAccount.id) {
          return touchAccountBalance(account, account.balance + amount * direction);
        }
        return account;
      }),
    };

    return nextStore;
  }

  const sourceAccountId = normalizeAccountReference(normalizedTransaction.fromAccountId);
  const destinationAccountId = normalizeAccountReference(normalizedTransaction.toAccountId);

  if (normalizedTransaction.type === "out") {
    const sourceAccount = nextStore.accounts.find(
      (account) => !account.deleted && !account.archivedAt && account.id === sourceAccountId
    );
    const card = nextStore.creditCards.find(
      (item) => !item.deleted && !item.archivedAt && item.id === normalizeAccountReference(normalizedTransaction.fromCardId)
    );

    if (sourceAccount) {
      nextStore = {
        ...nextStore,
        accounts: nextStore.accounts.map((account) =>
          account.id === sourceAccount.id
            ? touchAccountBalance(account, account.balance - amount * direction)
            : account
        ),
      };
    }

    if (card) {
      nextStore = {
        ...nextStore,
        creditCards: nextStore.creditCards.map((existingCard) => {
          if (existingCard.id !== card.id) return existingCard;
          const today = new Date();
          const currentDate = today.getDate();
          const statementDate = existingCard.statementDate || 1;
          const isUnbilled = currentDate >= statementDate;

          return touchCardBalance(existingCard, {
            outstanding: existingCard.outstanding + (isUnbilled ? 0 : amount * direction),
            unbilled: (existingCard.unbilled ?? 0) + (isUnbilled ? amount * direction : 0),
          });
        }),
      };
    }
  }

  if (normalizedTransaction.type === "in") {
    const destinationAccount = nextStore.accounts.find(
      (account) => !account.deleted && !account.archivedAt && account.id === destinationAccountId
    );
    const destinationCard = nextStore.creditCards.find(
      (item) => !item.deleted && !item.archivedAt && item.id === normalizeAccountReference(normalizedTransaction.toCardId)
    );

    if (destinationAccount) {
      nextStore = {
        ...nextStore,
        accounts: nextStore.accounts.map((account) =>
          account.id === destinationAccount.id
            ? touchAccountBalance(account, account.balance + amount * direction)
            : account
        ),
      };
    }

    if (destinationCard) {
      nextStore = {
        ...nextStore,
        creditCards: nextStore.creditCards.map((existingCard) => {
          if (existingCard.id !== destinationCard.id) return existingCard;
          return touchCardBalance(existingCard, {
            outstanding: existingCard.outstanding - amount * direction,
            unbilled: existingCard.unbilled ?? 0,
          });
        }),
      };
    }
  }

  return nextStore;
}

export function deleteTransactionFromStore(store: Store, transaction: Transaction): Store {
  const nextStore = applyTransactionEffectsToStore(store, transaction, -1);
  return normalizeStore({
    ...nextStore,
    transactions: nextStore.transactions.filter((item) => item.id !== transaction.id),
  });
}

export function restoreTransactionFromStore(store: Store, transaction: Transaction): Store {
  const nextStore = applyTransactionEffectsToStore(store, transaction, 1);
  return normalizeStore({
    ...nextStore,
    transactions: nextStore.transactions.some((item) => item.id === transaction.id)
      ? nextStore.transactions
      : [...nextStore.transactions, transaction],
  });
}

export function updateTransactionInStore(
  store: Store,
  previousTransaction: Transaction,
  nextTransaction: Partial<Transaction>
): Store {
  const nextStore = applyTransactionEffectsToStore(store, previousTransaction, -1);
  const updatedTransaction = {
    ...(nextTransaction as Transaction),
    id: nextTransaction.id ?? previousTransaction.id ?? crypto.randomUUID(),
    createdAt: nextTransaction.createdAt ?? previousTransaction.createdAt ?? new Date().toISOString(),
    updatedAt: nextTransaction.updatedAt ?? new Date().toISOString(),
    date: nextTransaction.date ?? previousTransaction.date ?? new Date().toISOString().split("T")[0],
    ledger: nextTransaction.ledger ?? previousTransaction.ledger ?? "",
    amount: Number(nextTransaction.amount ?? previousTransaction.amount ?? 0),
    type: normalizeTransactionType(nextTransaction.type ?? previousTransaction.type ?? "out"),
    category: nextTransaction.category ?? previousTransaction.category ?? "",
    fromAccount: nextTransaction.fromAccount ?? previousTransaction.fromAccount,
    fromAccountId: nextTransaction.fromAccountId ?? previousTransaction.fromAccountId,
    fromCardId: nextTransaction.fromCardId ?? previousTransaction.fromCardId,
    toAccount: nextTransaction.toAccount ?? previousTransaction.toAccount,
    toAccountId: nextTransaction.toAccountId ?? previousTransaction.toAccountId,
    toCardId: nextTransaction.toCardId ?? previousTransaction.toCardId,
    notes: nextTransaction.notes ?? previousTransaction.notes ?? "",
    tags: nextTransaction.tags ?? previousTransaction.tags ?? [],
    transferResolution: nextTransaction.transferResolution ?? previousTransaction.transferResolution,
    relatedEntityType: nextTransaction.relatedEntityType ?? previousTransaction.relatedEntityType,
    relatedEntityId: nextTransaction.relatedEntityId ?? previousTransaction.relatedEntityId,
    deleted: nextTransaction.deleted ?? previousTransaction.deleted,
    archivedAt: nextTransaction.archivedAt ?? previousTransaction.archivedAt,
  } as Transaction;

  const appliedStore = applyTransactionEffectsToStore(nextStore, updatedTransaction, 1);
  return normalizeStore({
    ...appliedStore,
    transactions: appliedStore.transactions.filter((item) => item.id !== previousTransaction.id).concat(updatedTransaction),
  });
}

export function archiveRecord<
  T extends { id: string; archivedAt?: string; updatedAt?: string; isArchived?: boolean }
>(
  items: T[],
  id: string
): T[] {
  const archivedAt = new Date().toISOString();
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          archivedAt,
          isArchived: true,
          updatedAt: archivedAt,
        }
      : item
  );
}

export function restoreRecord<
  T extends { id: string; archivedAt?: string; updatedAt?: string; isArchived?: boolean }
>(items: T[], id: string): T[] {
  const updatedAt = new Date().toISOString();

  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          archivedAt: undefined,
          isArchived: false,
          updatedAt,
        }
      : item
  );
}

export function deleteRecord<
  T extends { id: string; deleted?: boolean; updatedAt?: string }
>(items: T[], id: string): T[] {
  const updatedAt = new Date().toISOString();

  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          deleted: true,
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
    isArchived: account.isArchived ?? false,
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
    isArchived: card.isArchived ?? false,
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
    isArchived: loan.isArchived ?? false,
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
    isArchived: item.isArchived ?? false,
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
    isArchived: item.isArchived ?? false,
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
    history: (parsed.history ?? INITIAL_DATA.history).map(normalizeHistoryEvent),
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
    setStore((prev) => {
      const next = normalizeStore(updater(prev));
      const events = buildHistoryEvents(prev, next);

      if (events.length === 0) {
        return next;
      }

      return {
        ...next,
        history: [...events, ...(next.history ?? [])].slice(0, 300),
      };
    });
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