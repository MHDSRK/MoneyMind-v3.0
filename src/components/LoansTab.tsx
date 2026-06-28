import { useEffect, useRef, useState } from "react";
import { useStore, Loan, archiveRecord } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { MasterListRow } from "@/components/MasterListRow";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";
import { formatDisplayDate } from "@/utils/date";

export function LoansTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [loanPendingArchive, setLoanPendingArchive] = useState<Loan | null>(null);
  const [paymentSheetLoanId, setPaymentSheetLoanId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const loanRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const visibleLoans = store.loans.filter((loan) => !loan.deleted && !loan.archivedAt);
  const totalOutstanding = visibleLoans.reduce((sum, loan) => sum + loan.outstanding, 0);

  useEffect(() => {
    if (!location.startsWith("/loans")) return;

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) return;

    const target = store.loans.find((loan) => loan.id === focusId && !loan.deleted);
    if (!target) return;

    setHighlightedId(focusId);
    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      loanRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.loans]);


  const promptArchiveLoan = (loan: Loan) => {
    setLoanPendingArchive(loan);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveLoan = () => {
    if (!loanPendingArchive) return;

    updateStore((prev) => ({ ...prev, loans: archiveRecord(prev.loans, loanPendingArchive.id) }));
    toast({ title: "Loan archived", description: "The loan was archived and removed from active totals." });
    setArchiveDialogOpen(false);
    setLoanPendingArchive(null);
  };

  const cancelArchiveLoan = () => {
    setArchiveDialogOpen(false);
    setLoanPendingArchive(null);
  };

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loans</h2>
        </div>
        <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</div>
      </div>

      <div className="divide-y divide-white/10 overflow-hidden rounded-none bg-transparent">
        {visibleLoans.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">No active loans yet. Add one to begin.</div>
        ) : (
          visibleLoans.map((loan) => (
            <div
              key={loan.id}
              ref={(element) => { loanRefs.current[loan.id] = element; }}
              className={highlightedId === loan.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
            >
              <MasterListRow
                name={loan.name}
                amount={loan.outstanding}
                onClick={() => setSelectedLoan(loan)}
                onArchive={() => promptArchiveLoan(loan)}
                amountClassName="text-destructive"
                subtitle={loan.tag ? `${loan.tag}${loan.lender ? ` • ${loan.lender}` : ""}` : loan.lender || "Loan"}
                secondaryText={`Next EMI • ${formatDisplayDate(loan.nextEmiDate, "Not set")}`}
                secondaryTextClassName="text-muted-foreground"
              />
            </div>
          ))
        )}
      </div>

      <RecordDetailsDialog
        open={Boolean(selectedLoan)}
        title={selectedLoan?.name ?? "Loan details"}
        description={selectedLoan ? `Next EMI • ${formatDisplayDate(selectedLoan.nextEmiDate, "Not set")}` : ""}
        details={
          selectedLoan
            ? [
                { label: "Loan Amount", value: formatCurrency(selectedLoan.principal) },
                { label: "Outstanding", value: formatCurrency(selectedLoan.outstanding) },
                { label: "EMI / Month", value: formatCurrency(selectedLoan.emiAmount) },
                { label: "Lender", value: selectedLoan.lender || "Not set" },
              ]
            : []
        }
        footerActions={
          selectedLoan
            ? [
                {
                  key: "history",
                  label: "History",
                  variant: "secondary",
                  onClick: () => setPaymentSheetLoanId(selectedLoan.id),
                },
                {
                  key: "archive",
                  label: "Archive",
                  variant: "warning",
                  onClick: () => promptArchiveLoan(selectedLoan),
                },
                {
                  key: "close",
                  label: "Close",
                  variant: "primary",
                  onClick: () => setSelectedLoan(null),
                },
              ]
            : [{ key: "close", label: "Close", variant: "primary", onClick: () => setSelectedLoan(null) }]
        }
        onClose={() => setSelectedLoan(null)}
      />

      <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => !open && cancelArchiveLoan()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{loanPendingArchive?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Archived loans will no longer appear in active totals.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelArchiveLoan}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmArchiveLoan} className="bg-destructive text-white hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {paymentSheetLoanId && (() => {
        const loan = store.loans.find((l) => l.id === paymentSheetLoanId);
        if (!loan) return null;
        return (
          <PaymentHistorySheet
            open
            onClose={() => setPaymentSheetLoanId(null)}
            entityType="loan"
            entityId={loan.id}
            entityName={loan.name}
            outstanding={loan.outstanding}
            defaultAmount={loan.emiAmount}
          />
        );
      })()}
    </div>
  );
}
