import { Store } from "@/hooks/useStore";

export type SearchResultType =
  | "account"
  | "credit-card"
  | "loan"
  | "liability"
  | "transaction"
  | "lend";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  transactionType?: "in" | "out" | "transfer";
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  route: string;
  focusId: string;
}

export function searchStore(store: Store, rawQuery: string): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return [];
  }

  const includes = (...values: Array<string | number | undefined>) =>
    values.some((value) => String(value ?? "").toLowerCase().includes(query));

  return [
    ...store.accounts
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(item.name, item.balance, item.type)
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "account" as const,
        title: item.name,
        subtitle: item.type ?? "Account",
        amount: item.balance,
        route: "/assets",
      })),

    ...store.creditCards
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(item.name, item.provider, item.outstanding, item.unbilled, item.creditLimit)
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "credit-card" as const,
        title: item.name,
        subtitle: item.provider,
        amount: item.outstanding,
        route: "/cards",
      })),

    ...store.loans
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(item.name, item.lender, item.outstanding, item.emiAmount)
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "loan" as const,
        title: item.name,
        subtitle: item.lender,
        amount: item.outstanding,
        route: "/loans",
      })),

    ...store.liabilities
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(item.name, item.group, item.amount)
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "liability" as const,
        title: item.name,
        subtitle: item.group,
        amount: item.amount,
        route: "/others",
      })),

    ...store.transactions
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(
            item.ledger,
            item.category,
            item.notes,
            item.amount,
            item.fromAccount,
            item.toAccount,
            item.account,
            item.date,
            (item.tags ?? []).join(" ")
          )
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "transaction" as const,
        transactionType: item.type,
        title: item.type === "transfer" ? "Self Transfer" : item.category,
        subtitle: item.notes || item.ledger || item.date,
        amount: item.amount,
        date: item.date,
        route: "/",
      })),

    ...store.lends
      .filter(
        (item) =>
          !item.deleted &&
          !item.archivedAt &&
          includes(item.name, item.amount, item.date)
      )
      .map((item) => ({
        id: item.id,
        focusId: item.id,
        type: "lend" as const,
        title: item.name,
        subtitle: item.date,
        amount: item.amount,
        date: item.date,
        route: "/assets",
      })),
  ];
}
