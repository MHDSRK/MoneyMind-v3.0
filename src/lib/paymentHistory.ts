import { Transaction, Store } from "@/hooks/useStore";

export function getPaymentHistory(
  store: Store,
  entityType: "loan" | "credit-card" | "liability",
  entityId: string
): Transaction[] {
  return store.transactions
    .filter(
      (transaction) =>
        transaction.relatedEntityType === entityType &&
        transaction.relatedEntityId === entityId &&
        !transaction.deleted
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getTotalPaid(
  store: Store,
  entityType: "loan" | "credit-card" | "liability",
  entityId: string
): number {
  return getPaymentHistory(store, entityType, entityId).reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
}
