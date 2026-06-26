import { Store, Transaction, normalizeStore, normalizeTransactionType } from "@/hooks/useStore";

function touchAccountBalance(
  account: Store["accounts"][number],
  balance: number
) {
  return {
    ...account,
    balance,
    updatedAt: new Date().toISOString(),
  };
}

function touchCardBalance(
  card: Store["creditCards"][number],
  changes: Pick<Store["creditCards"][number], "outstanding" | "unbilled">
) {
  return {
    ...card,
    ...changes,
    updatedAt: new Date().toISOString(),
  };
}

function findAccountById(store: Store, accountId?: string) {
  return store.accounts.find((account) => !account.deleted && !account.archivedAt && account.id === accountId);
}

function normalizeAccountReference(value?: string) {
  return value?.replace(/^account:/, "").replace(/^card:/, "");
}

function resolveTransferAccount(store: Store, accountId?: string) {
  const normalizedAccountId = normalizeAccountReference(accountId);

  if (!normalizedAccountId) {
    return undefined;
  }

  return findAccountById(store, normalizedAccountId);
}

function findCardById(store: Store, cardId?: string) {
  return store.creditCards.find((card) => !card.deleted && !card.archivedAt && card.id === cardId);
}

export function applyTransactionEffects(
  store: Store,
  transaction: Partial<Transaction>,
  direction: 1 | -1
): Store {
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
    if (normalizedTransaction.type === "transfer") {
      throw new Error("Self transfer amount must be greater than zero");
    }
    throw new Error("Transaction amount must be greater than zero");
  }

  let nextStore = { ...store };

  if (normalizedTransaction.type === "transfer") {
    const fromAccountId = normalizeAccountReference(normalizedTransaction.fromAccountId);
    const toAccountId = normalizeAccountReference(normalizedTransaction.toAccountId);

    if (!fromAccountId || !toAccountId) {
      throw new Error("Self transfer requires accounts");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Self transfer requires different accounts");
    }

    if (amount <= 0) {
      throw new Error("Self transfer amount must be greater than zero");
    }

    const fromAccount = resolveTransferAccount(nextStore, fromAccountId);
    const toAccount = resolveTransferAccount(nextStore, toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Selected Self transfer account was not found");
    }

    if (direction === 1 && fromAccount.balance < amount) {
      throw new Error("Insufficient funds for transfer");
    }

    nextStore = {
      ...nextStore,
      accounts: nextStore.accounts.map((account) => {
        if (account.id === fromAccount.id) {
          return touchAccountBalance(
            account,
            account.balance - amount * direction
          );
        }
        if (account.id === toAccount.id) {
          return touchAccountBalance(
            account,
            account.balance + amount * direction
          );
        }
        return account;
      }),
    };

    return nextStore;
  }

  const sourceAccountId = normalizeAccountReference(normalizedTransaction.fromAccountId);
  const destinationAccountId = normalizeAccountReference(normalizedTransaction.toAccountId);

  if (normalizedTransaction.type === "out") {
    const sourceAccount = findAccountById(nextStore, sourceAccountId);
    const card = findCardById(
      nextStore,
      normalizeAccountReference(normalizedTransaction.fromCardId)
    );

    if (!sourceAccount && !card) {
      throw new Error("Money Out requires a valid source account or card");
    }

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
      const isUnbilledQuickAdd =
        normalizedTransaction.category === "Unbilled" ||
        normalizedTransaction.tags.includes("unbilled");

      if (isUnbilledQuickAdd) {
        nextStore = {
          ...nextStore,
          creditCards: nextStore.creditCards.map((existingCard) => {
            if (existingCard.id !== card.id) return existingCard;
            return touchCardBalance(existingCard, {
              outstanding: existingCard.outstanding,
              unbilled: (existingCard.unbilled ?? 0) + amount * direction,
            });
          }),
        };
      } else {
        const today = new Date();
        const currentDate = today.getDate();
        const statementDate = card.statementDate || 1;
        const isUnbilled = currentDate >= statementDate;

        nextStore = {
          ...nextStore,
          creditCards: nextStore.creditCards.map((existingCard) => {
            if (existingCard.id !== card.id) return existingCard;
            return touchCardBalance(existingCard, {
              outstanding:
                existingCard.outstanding + (isUnbilled ? 0 : amount * direction),
              unbilled:
                (existingCard.unbilled ?? 0) +
                (isUnbilled ? amount * direction : 0),
            });
          }),
        };
      }
    }
  }

  if (normalizedTransaction.type === "in") {
    const destinationAccount = findAccountById(nextStore, destinationAccountId);
    const destinationCard = findCardById(
      nextStore,
      normalizeAccountReference(normalizedTransaction.toCardId)
    );

    if (!destinationAccount && !destinationCard) {
      throw new Error("Money In requires a valid destination account or card");
    }

    if (destinationAccount) {
      nextStore = {
        ...nextStore,
        accounts: nextStore.accounts.map((account) =>
          account.id === destinationAccount.id
            ? touchAccountBalance(account, account.balance + amount * direction)
            : account
        ),
      };
    } else if (destinationCard) {
      nextStore = {
        ...nextStore,
        creditCards: nextStore.creditCards.map((existingCard) => {
          if (existingCard.id !== destinationCard.id) return existingCard;

          const nextOutstanding =
            existingCard.outstanding - amount * direction;

          if (nextOutstanding < 0) {
            throw new Error("Card payment cannot exceed the outstanding amount");
          }

          return touchCardBalance(existingCard, {
            outstanding: nextOutstanding,
            unbilled: existingCard.unbilled ?? 0,
          });
        }),
      };
    }
  }

  return nextStore;
}

export function createUnbilledTransaction(
  store: Store,
  cardId: string,
  amount: number,
  notes?: string
): Store {
  return createTransaction(store, {
    id: crypto.randomUUID(),
    date: new Date().toISOString().split("T")[0],
    type: "out",
    amount,
    ledger: "Quick Add",
    category: "Unbilled",
    fromCardId: cardId,
    notes: notes ?? "Quick add unbilled expense",
    tags: ["unbilled"],
    relatedEntityType: "credit-card",
    relatedEntityId: cardId,
  });
}

export function createTransaction(
  store: Store,
  transaction: Partial<Transaction>
): Store {
  const normalized = {
    ...transaction,
    id: transaction.id ?? crypto.randomUUID(),
    date: transaction.date ?? new Date().toISOString().split("T")[0],
    ledger: transaction.ledger ?? "",
    amount: Number(transaction.amount ?? 0),
    type: normalizeTransactionType(transaction.type),
    category: transaction.category ?? "",
    fromAccount: transaction.fromAccount,
    fromAccountId: transaction.fromAccountId,
    fromCardId: transaction.fromCardId,
    toAccount: transaction.toAccount,
    toAccountId: transaction.toAccountId,
    toCardId: transaction.toCardId,
    notes: transaction.notes ?? "",
    tags: transaction.tags ?? [],
    createdAt: transaction.createdAt ?? new Date().toISOString(),
    updatedAt: transaction.updatedAt ?? new Date().toISOString(),
  } as Transaction;

  if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) {
    if (normalized.type === "transfer") {
      throw new Error("Self transfer amount must be greater than zero");
    }
    throw new Error("Transaction amount must be greater than zero");
  }

  const nextStore = applyTransactionEffects(store, normalized, 1);
  return normalizeStore({
    ...nextStore,
    transactions: [...nextStore.transactions, normalized],
  });
}

export function updateTransaction(
  store: Store,
  previousTransaction: Transaction,
  nextTransaction: Partial<Transaction>
): Store {
  const nextStore = applyTransactionEffects(store, previousTransaction, -1);
  const updated = createTransaction(nextStore, nextTransaction);
  return normalizeStore({
    ...updated,
    transactions: updated.transactions.filter((transaction) => transaction.id !== previousTransaction.id).concat({
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
    }),
  });
}

export function deleteTransaction(
  store: Store,
  transaction: Transaction
): Store {
  const nextStore = applyTransactionEffects(store, transaction, -1);
  return normalizeStore({
    ...nextStore,
    transactions: nextStore.transactions.filter((item) => item.id !== transaction.id),
  });
}

export const applyTransaction = createTransaction;
