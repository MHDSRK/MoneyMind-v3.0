import { Store, Transaction } from "@/hooks/useStore";
import { differenceInCalendarDays } from "date-fns";

/**
 * Automatic calculations for all financial metrics
 * These are derived values - do NOT manually update them
 */

export interface FinancialMetrics {
  cashBalance: number;
  bankBalance: number;
  businessBalance: number;
  investmentsBalance: number;
  insuranceBalance: number;
  otherAssetsBalance: number;
  totalAssets: number;

  creditCardOutstanding: number;
  creditCardUnbilled: number;
  creditCardTotalLimit: number;
  creditCardAvailableLimit: number;

  loanOutstanding: number;
  loanTotalPrincipal: number;

  totalLiabilities: number;
  netWorth: number;

  // Today's flows
  todayIncome: number;
  todayExpense: number;
  todayNet: number;

  // Monthly
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
}

function normalizeAccountReference(value?: string) {
  return value?.replace(/^account:/, "").replace(/^card:/, "");
}

function normalizeTrackingValue(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function isTrackingLabel(value?: string): boolean {
  const normalizedValue = normalizeTrackingValue(value);
  if (!normalizedValue) return false;

  return /\blent\b/.test(normalizedValue) || normalizedValue === "tracking" || normalizedValue === "tracking-only";
}

export function isTrackingAccount(account: { name?: string }): boolean {
  return isTrackingLabel(account.name);
}

export function isLentAccount(account: { name?: string }): boolean {
  return isTrackingAccount(account);
}

export function isFinancialAccount(account: { deleted?: boolean; archivedAt?: string; name?: string; type?: string }): boolean {
  return !account.deleted && !account.archivedAt && !isTrackingAccount(account);
}

export function isTrackingTransaction(transaction: Transaction): boolean {
  const candidates = [
    transaction.category,
    transaction.ledger,
    transaction.account,
    transaction.fromAccount,
    transaction.toAccount,
    transaction.notes,
  ];

  return candidates.some((value) => isTrackingLabel(value));
}

export interface UpcomingCreditCardDue {
  id: string;
  name: string;
  outstanding: number;
  nextDueDate: string;
  daysLeft: number;
}

export interface LiabilityScopeSummary {
  kind: "item" | "group" | "all";
  amount: number;
  id?: string;
  group?: string;
}

export function getUpcomingCreditCardDues(
  store: Store,
  options: { referenceDate?: Date; daysAhead?: number } = {}
): UpcomingCreditCardDue[] {
  const referenceDate = new Date(options.referenceDate ?? new Date());
  referenceDate.setHours(0, 0, 0, 0);
  const daysAhead = options.daysAhead ?? 5;

  return store.creditCards
    .filter((card) => !card.deleted && !card.archivedAt && card.outstanding > 0)
    .map((card) => {
      if (!card.nextDueDate) return null;

      const dueDate = new Date(card.nextDueDate);
      if (Number.isNaN(dueDate.getTime())) return null;

      const daysLeft = differenceInCalendarDays(dueDate, referenceDate);
      if (daysLeft < 0 || daysLeft > daysAhead) return null;

      return {
        id: card.id,
        name: card.name,
        outstanding: card.outstanding,
        nextDueDate: card.nextDueDate,
        daysLeft,
      };
    })
    .filter((item): item is UpcomingCreditCardDue => Boolean(item))
    .sort((a, b) => {
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
      return a.name.localeCompare(b.name);
    });
}

export function getLiabilityGroupTotals(store: Store): Record<string, number> {
  return store.liabilities.reduce((totals, item) => {
    if (item.deleted || item.archivedAt) return totals;
    const current = totals[item.group] ?? 0;
    totals[item.group] = current + item.amount;
    return totals;
  }, {} as Record<string, number>);
}

export function getCreditCardAvailableAmount(card: { creditLimit: number; outstanding: number; unbilled?: number }): number {
  return card.creditLimit - card.outstanding - (card.unbilled ?? 0);
}

export function getCreditCardDueAmount(card: { outstanding: number; unbilled?: number }): number {
  return card.outstanding + (card.unbilled ?? 0);
}

export function getLiabilityScopeSummary(
  store: Store,
  selectedLiabilityId: string | null,
  selectedGroup: string | null
): LiabilityScopeSummary {
  const visibleLiabilities = store.liabilities.filter((item) => !item.deleted && !item.archivedAt);

  if (selectedLiabilityId) {
    const selectedItem = visibleLiabilities.find((item) => item.id === selectedLiabilityId);
    if (selectedItem) {
      return { kind: "item", amount: selectedItem.amount, id: selectedItem.id, group: selectedItem.group };
    }
  }

  if (selectedGroup) {
    const groupTotal = visibleLiabilities
      .filter((item) => item.group === selectedGroup)
      .reduce((sum, item) => sum + item.amount, 0);

    if (groupTotal > 0 || visibleLiabilities.some((item) => item.group === selectedGroup)) {
      return { kind: "group", amount: groupTotal, group: selectedGroup };
    }
  }

  const totalLiabilities = visibleLiabilities.reduce((sum, item) => sum + item.amount, 0);
  return { kind: "all", amount: totalLiabilities };
}

export function calculateMetrics(store: Store): FinancialMetrics {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split("T")[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // Account Balances by Type
  // ─────────────────────────────────────────────────────────────────────────────
  const activeFinancialAccounts = store.accounts.filter(isFinancialAccount);
  const activeCreditCards = store.creditCards.filter((c) => !c.deleted && !c.archivedAt);
  const activeLoans = store.loans.filter((l) => !l.deleted && !l.archivedAt);
  const activeLiabilities = store.liabilities.filter((item) => !item.deleted && !item.archivedAt);

  const cashBalance = activeFinancialAccounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);

  const bankBalance = activeFinancialAccounts
    .filter((a) => a.type === "bank")
    .reduce((sum, a) => sum + a.balance, 0);

  const businessBalance = activeFinancialAccounts
    .filter((a) => a.type === "business")
    .reduce((sum, a) => sum + a.balance, 0);

  const investmentsBalance = activeFinancialAccounts
    .filter((a) => a.type === "investments")
    .reduce((sum, a) => sum + a.balance, 0);

  const insuranceBalance = activeFinancialAccounts
    .filter((a) => a.type === "insurance")
    .reduce((sum, a) => sum + a.balance, 0);

  const otherAssetsBalance = activeFinancialAccounts
    .filter((a) => a.type === "other")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalAssets =
    cashBalance + bankBalance + businessBalance + investmentsBalance + insuranceBalance + otherAssetsBalance;

  // ─────────────────────────────────────────────────────────────────────────────
  // Credit Card Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  const creditCardOutstanding = activeCreditCards.reduce((sum, c) => sum + c.outstanding, 0);

  const creditCardUnbilled = activeCreditCards.reduce((sum, card) => sum + (card.unbilled ?? 0), 0);

  const creditCardTotalLimit = activeCreditCards.reduce((sum, c) => sum + c.creditLimit, 0);

  const creditCardAvailableLimit =
    creditCardTotalLimit -
    creditCardOutstanding -
    creditCardUnbilled;

  // ─────────────────────────────────────────────────────────────────────────────
  // Loan Metrics
  // ─────────────────────────────────────────────────────────────────────────────
  const loanOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding, 0);

  const loanTotalPrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);

  const manualLiabilities = activeLiabilities.reduce((sum, item) => sum + item.amount, 0);

  const totalLiabilities = creditCardOutstanding + loanOutstanding + manualLiabilities;

  // ─────────────────────────────────────────────────────────────────────────────
  // Net Worth
  // ─────────────────────────────────────────────────────────────────────────────
  const netWorth = totalAssets - totalLiabilities;

  // ─────────────────────────────────────────────────────────────────────────────
  // Today's Cash Flow
  // ─────────────────────────────────────────────────────────────────────────────
  const todayTransactions = store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.date === todayStr && !isTrackingTransaction(t)
  );

  const todayIncome = todayTransactions
    .filter((t) => t.type === "in")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayNet = todayIncome - todayExpense;

  // ─────────────────────────────────────────────────────────────────────────────
  // Monthly Cash Flow
  // ─────────────────────────────────────────────────────────────────────────────
  const monthTransactions = store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.date >= monthStartStr && t.date <= todayStr && !isTrackingTransaction(t)
  );

  const monthlyIncome = monthTransactions
    .filter((t) => t.type === "in")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthTransactions
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyNet = monthlyIncome - monthlyExpense;

  return {
    cashBalance,
    bankBalance,
    businessBalance,
    investmentsBalance,
    insuranceBalance,
    otherAssetsBalance,
    totalAssets,

    creditCardOutstanding,
    creditCardUnbilled,
    creditCardTotalLimit,
    creditCardAvailableLimit,

    loanOutstanding,
    loanTotalPrincipal,

    totalLiabilities,
    netWorth,

    todayIncome,
    todayExpense,
    todayNet,

    monthlyIncome,
    monthlyExpense,
    monthlyNet,
  };
}

/**
 * Get account balance by account ID
 */
export function getAccountBalance(store: Store, accountId: string): number {
  const account = store.accounts.find((a) => a.id === accountId && !a.deleted && !a.archivedAt);
  return account?.balance ?? 0;
}

/**
 * Get credit card available credit
 */
export function getCreditCardAvailable(store: Store, cardId: string): number {
  const card = store.creditCards.find((c) => c.id === cardId && !c.deleted && !c.archivedAt);
  if (!card) return 0;
  return card.creditLimit - card.outstanding;
}

/**
 * Get loan EMI dates
 */
export function getNextLoanEmiDate(store: Store, loanId: string): Date | null {
  const loan = store.loans.find((l) => l.id === loanId && !l.deleted && !l.archivedAt);
  if (!loan || !loan.nextEmiDate) return null;
  return new Date(loan.nextEmiDate);
}

/**
 * Calculate remaining EMIs
 */
export function getRemainingEmis(store: Store, loanId: string): number {
  const loan = store.loans.find((l) => l.id === loanId && !l.deleted && !l.archivedAt);
  if (!loan) return 0;
  return loan.emiCount - loan.paidCount;
}

/**
 * Get transactions for a specific date range
 */
export function getTransactionsInRange(
  store: Store,
  startDate: string,
  endDate: string
): typeof store.transactions {
  return store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.date >= startDate && t.date <= endDate
  );
}

/**
 * Get transactions by category
 */
export function getTransactionsByCategory(
  store: Store,
  category: string
): typeof store.transactions {
  return store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.category === category
  );
}

/**
 * Get transactions by tag
 */
export function getTransactionsByTag(
  store: Store,
  tag: string
): typeof store.transactions {
  return store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.tags.includes(tag)
  );
}

/**
 * Get account balance history for charting
 */
export function getAccountBalanceHistory(
  store: Store,
  accountId: string,
  days: number = 30
): Array<{ date: string; balance: number }> {
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account) return [];

  const isFromAccount = (transaction: Transaction) => {
    const fromAccountId = normalizeAccountReference(transaction.fromAccountId);
    return fromAccountId ? fromAccountId === accountId : transaction.fromAccount === account.name;
  };

  const isToAccount = (transaction: Transaction) => {
    const toAccountId = normalizeAccountReference(transaction.toAccountId);
    return toAccountId ? toAccountId === accountId : transaction.toAccount === account.name;
  };

  const accountTransactions = store.transactions
    .filter(
      (t) =>
        !t.deleted &&
        !t.archivedAt &&
        (isFromAccount(t) || isToAccount(t))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const currentBalance = account.balance;
  const result = [];

  // Start from today and work backwards
  const today = new Date();
  let runningBalance = currentBalance;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Find transactions for this date related to this account
    const dayTransactions = accountTransactions.filter((t) => t.date === dateStr);
    for (const t of dayTransactions.reverse()) {
      if (isFromAccount(t)) {
        runningBalance += t.amount; // reverse the debit
      } else if (isToAccount(t)) {
        runningBalance -= t.amount; // reverse the credit
      }
    }

    result.unshift({ date: dateStr, balance: runningBalance });
  }

  return result;
}
