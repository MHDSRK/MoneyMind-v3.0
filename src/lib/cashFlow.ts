import { Transaction } from "@/hooks/useStore";
import { isTrackingTransaction } from "./calculations";
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from "date-fns";

export function calculateCashFlow(
  transactions: Transaction[],
  startDate: string,
  endDate: string
) {
  const filtered = transactions.filter((transaction) => {
    if (transaction.deleted || transaction.type === "transfer" || isTrackingTransaction(transaction)) {
      return false;
    }

    return transaction.date >= startDate && transaction.date <= endDate;
  });

  const income = filtered
    .filter((transaction) => transaction.type === "in")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expense = filtered
    .filter((transaction) => transaction.type === "out")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expense,
    netCashFlow: income - expense,
  };
}

export interface MonthlyFlow {
  month: string;   // "Jan 2025"
  monthKey: string; // "2025-01"
  income: number;
  expense: number;
  net: number;
}

export function calculateMonthlyTrend(
  transactions: Transaction[],
  monthsBack: number
): MonthlyFlow[] {
  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), monthsBack - 1),
    end: startOfMonth(now),
  });

  return months.map((month) => {
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");
    const { income, expense, netCashFlow } = calculateCashFlow(transactions, start, end);
    return {
      month: format(month, "MMM yyyy"),
      monthKey: format(month, "yyyy-MM"),
      income,
      expense,
      net: netCashFlow,
    };
  });
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  type: "in" | "out"
): CategoryBreakdown[] {
  const filtered = transactions.filter(
    (tx) =>
      !tx.deleted &&
      !isTrackingTransaction(tx) &&
      tx.type === type &&
      tx.date >= startDate &&
      tx.date <= endDate
  );

  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const tx of filtered) {
    const cat = tx.category || "Uncategorized";
    const existing = categoryMap.get(cat) ?? { amount: 0, count: 0 };
    categoryMap.set(cat, {
      amount: existing.amount + tx.amount,
      count: existing.count + 1,
    });
  }

  return Array.from(categoryMap.entries())
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      count,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getDateRange(period: "this-month" | "last-3-months" | "last-6-months" | "this-year" | "last-12-months"): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  switch (period) {
    case "this-month":
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: today,
        label: format(now, "MMMM yyyy"),
      };
    case "last-3-months":
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
        endDate: today,
        label: "Last 3 Months",
      };
    case "last-6-months":
      return {
        startDate: format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd"),
        endDate: today,
        label: "Last 6 Months",
      };
    case "this-year":
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: today,
        label: `Year ${now.getFullYear()}`,
      };
    case "last-12-months":
      return {
        startDate: format(startOfMonth(subMonths(now, 11)), "yyyy-MM-dd"),
        endDate: today,
        label: "Last 12 Months",
      };
  }
}
