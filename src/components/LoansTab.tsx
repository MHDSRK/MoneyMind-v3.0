import { useEffect, useRef, useState } from "react";
import { useStore, Loan, archiveRecord } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { getRemainingEmis } from "@/lib/calculations";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
          visibleLoans.map((loan) => {
            const remainingMonths = Math.max(0, getRemainingEmis(store, loan.id));
            const subtitle = loan.tag ? `${loan.tag}${loan.lender ? ` • ${loan.lender}` : ""}` : loan.lender || "Loan";

            return (
              <div
                key={loan.id}
                ref={(element) => { loanRefs.current[loan.id] = element; }}
                className={highlightedId === loan.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
              >
                <button
                  type="button"
                  onClick={() => setSelectedLoan(loan)}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-primary/40 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{loan.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
                    </div>
                    <div className="text-right min-w-[120px] text-right">
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{formatCurrency(loan.principal)}</p>
                      <p className="mt-3 text-lg font-semibold text-destructive">{formatCurrency(loan.outstanding)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/5 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">EMI</p>
                      <p className="mt-2 text-sm font-semibold text-sky-400">{formatCurrency(loan.emiAmount)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">DATE</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{formatDisplayDate(loan.nextEmiDate, "Not set")}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Remaining</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{remainingMonths} Months</p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>

      <RecordDetailsDialog
        open={Boolean(selectedLoan)}
        title={selectedLoan?.name ?? "Loan details"}
        description={selectedLoan ? `Next EMI • ${formatDisplayDate(selectedLoan.nextEmiDate, "Not set")}` : ""}
        details={
          selectedLoan
            ? [
                { label: "Loan Amount", value: formatCurrency(selectedLoan.principal), valueClassName: "text-foreground" },
                { label: "Outstanding", value: formatCurrency(selectedLoan.outstanding), valueClassName: "text-destructive" },
              ]
            : []
        }
        plainDetails
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
