import * as XLSX from "xlsx";
import { format, startOfMonth, subMonths } from "date-fns";
import type { Store } from "@/hooks/useStore";

export function getAccountStatus(
  accounts: Store["accounts"],
  accountId?: string
): string {
  const account = accounts.find((item) => item.id === accountId);
  if (!account) return "Unknown";
  if (account.deleted) return "Deleted";
  if (account.archivedAt) return "Archived";
  return "Active";
}

export function filterTx(
  transactions: Store["transactions"],
  period: string,
  customStart: string,
  customEnd: string
): Store["transactions"] {
  const now = new Date();
  switch (period) {
    case "today": {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "this-month": {
      const s = startOfMonth(now);
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "last-6-months": {
      const s = startOfMonth(subMonths(now, 6));
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "custom": {
      if (!customStart || !customEnd) return [];
      const s = new Date(customStart + "T00:00:00");
      const e = new Date(customEnd + "T23:59:59");
      return transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= s && d <= e;
      });
    }
    default:
      return transactions;
  }
}

export function buildAndDownload(
  transactions: Store["transactions"],
  creditCards: Store["creditCards"],
  loans: Store["loans"],
  accounts: Store["accounts"],
  label: string
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const txRows = transactions.map((tx) => ({
    Date: format(new Date(tx.date), "dd/MM/yyyy"),
    Type:
      tx.type === "in"
        ? "Money In"
        : tx.type === "out"
          ? "Money Out"
          : "Self Transfer",
    "Ledger / Name": tx.ledger,
    Category: tx.category,
    "From Account": tx.fromAccount || "",
    "From Account ID": tx.fromAccountId || "",
    "From Account Status": getAccountStatus(accounts, tx.fromAccountId),
    "To Account ID": tx.toAccountId || "",
    "To Account Status": getAccountStatus(accounts, tx.toAccountId),
    "To Account": tx.toAccount || "",
    "Amount (₹)": tx.amount,
    Notes: tx.notes || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");

  // Sheet 2: Accounts
  const acctRows = accounts
    .filter((a) => !a.deleted && !a.archivedAt)
    .map((a) => ({
      Name: a.name,
      Type: a.type,
      "Balance (₹)": a.balance,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acctRows), "Accounts");

  // Sheet 3: Credit Cards
  const ccRows = creditCards
    .filter((c) => !c.deleted && !c.archivedAt)
    .map((c) => ({
      Name: c.name,
      Provider: c.provider,
      "Credit Limit (₹)": c.creditLimit,
      "Outstanding (₹)": c.outstanding,
      "Available (₹)": c.creditLimit - c.outstanding - (c.unbilled ?? 0),
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ccRows), "Credit Cards");

  // Sheet 4: Loans
  const loanRows = loans
    .filter((l) => !l.deleted && !l.archivedAt)
    .map((l) => ({
      Name: l.name,
      Lender: l.lender,
      "Principal (₹)": l.principal,
      "Interest Rate (%)": l.interestRate,
      "EMI (₹)": l.emiAmount,
      "Outstanding (₹)": l.outstanding,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loanRows), "Loans");

  XLSX.writeFile(wb, `MoneyMind_${label.replace(/\s+/g, "_")}.xlsx`);
}
