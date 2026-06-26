import { formatCurrency, cn } from "@/lib/utils";
import { useStore, updateLoan, archiveRecord } from "@/hooks/useStore";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SwipeableListItem } from "@/components/SwipeableListItem";
import { Plus, Pencil, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";

export function LoansTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLender, setEditLender] = useState("");
  const [editPrincipal, setEditPrincipal] = useState("");
  const [editOutstanding, setEditOutstanding] = useState("");
  const [editEMI, setEditEMI] = useState("");
  const [editRemainingMonths, setEditRemainingMonths] = useState("");
  const [editNextEmiDate, setEditNextEmiDate] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [paymentSheetLoanId, setPaymentSheetLoanId] = useState<string | null>(null);
  const loanRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!location.startsWith("/loans")) {
      return;
    }

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      return;
    }

    const target = store.loans.find((loan) => loan.id === focusId && !loan.deleted);
    if (!target) {
      return;
    }

    setEditingLoanId(null);
    setHighlightedId(focusId);

    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      loanRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.loans]);

  const handleAddLoan = () => {
    updateStore((prev) => ({
      ...prev,
      loans: [
        ...prev.loans,
        {
          id: crypto.randomUUID(),
          name: "New Loan",
          lender: "",
          principal: 0,
          interestRate: 0,
          emiAmount: 0,
          emiCount: 60,
          paidCount: 0,
          emiFrequency: "monthly" as const,
          outstanding: 0,
          startDate: new Date().toISOString().split("T")[0],
          nextEmiDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleEditStart = (loanId: string) => {
    const loan = store.loans.find((l) => l.id === loanId);
    if (loan) {
      setEditingLoanId(loanId);
      setEditName(loan.name);
      setEditLender(loan.lender);
      setEditPrincipal(loan.principal.toString());
      setEditOutstanding(loan.outstanding.toString());
      setEditEMI(loan.emiAmount.toString());
      setEditRemainingMonths((loan.emiCount - loan.paidCount).toString());
      setEditNextEmiDate(loan.nextEmiDate ? new Date(loan.nextEmiDate).toISOString().split('T')[0] : "");
    }
  };

  const handleEditSave = (loanId: string) => {
    updateStore((prev) => updateLoan(prev, loanId, {
      name: editName,
      lender: editLender,
      principal: parseInt(editPrincipal) || 0,
      outstanding: parseInt(editOutstanding) || 0,
      emiAmount: parseInt(editEMI) || 0,
      emiCount: parseInt(editRemainingMonths) + (store.loans.find((l) => l.id === loanId)?.paidCount ?? 0),
      nextEmiDate: editNextEmiDate ? new Date(editNextEmiDate).toISOString() : undefined,
    }));
    setEditingLoanId(null);
  };

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [loanPendingArchive, setLoanPendingArchive] = useState<ReturnType<typeof store.loans[number]> | null>(null);

  const handleArchiveLoan = (loanId: string) => {
    updateStore((prev) => ({
      ...prev,
      loans: archiveRecord(prev.loans, loanId),
    }));
    toast({ title: "Loan archived", description: "The loan was archived and removed from active totals." });
  };

  const promptArchiveLoan = (loan: ReturnType<typeof store.loans[number]>) => {
    setLoanPendingArchive(loan);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveLoan = () => {
    if (!loanPendingArchive) return;
    handleArchiveLoan(loanPendingArchive.id);
    setArchiveDialogOpen(false);
    setLoanPendingArchive(null);
  };

  const cancelArchiveLoan = () => {
    setArchiveDialogOpen(false);
    setLoanPendingArchive(null);
  };

  const handleHardDeleteLoan = (loanId: string) => {
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) {
      return;
    }

    updateStore((prev) => updateLoan(prev, loanId, { deleted: true }));
    toast({ title: "Loan deleted", description: "The record was permanently deleted." });
  };

  const visibleLoans = store.loans.filter(
    (loan) => !loan.deleted && !loan.archivedAt
  );
  const totalOutstanding = visibleLoans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalEmiPerMonth = visibleLoans.reduce((sum, l) => sum + l.emiAmount, 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Summary */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">TOTAL OUTSTANDING</span>
        <h2 className={cn(
          "text-5xl font-bold tracking-tight mb-6",
          totalOutstanding < 0 ? "text-destructive" : "text-destructive"
        )}>
          {formatCurrency(totalOutstanding)}
        </h2>
        <div className="flex w-full justify-between px-4">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Monthly EMI</span>
            <span className="text-primary font-medium">{formatCurrency(totalEmiPerMonth)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Loans Count</span>
            <span className="text-[#34d399] font-medium">{visibleLoans.length}</span>
          </div>
        </div>
      </div>

      {/* Loans List */}
      {visibleLoans.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground italic text-sm">
          No loans yet. Click the ADD NEW button below to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLoans.map((loan) => {
            const isEditing = editingLoanId === loan.id;

            return (
              <SwipeableListItem
                key={loan.id}
                className={cn("glass-card p-4 space-y-3", highlightedId === loan.id && "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]")}
                actionLabel="Archive"
                onAction={() => promptArchiveLoan(loan)}
              >
                <div
                  ref={(element) => {
                    loanRefs.current[loan.id] = element;
                  }}
                >
                {/* Header with Edit Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Loan Name"
                          className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm text-foreground outline-none font-bold"
                        />
                        <input 
                          type="text" 
                          value={editLender}
                          onChange={(e) => setEditLender(e.target.value)}
                          placeholder="Lender Name"
                          className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-foreground">{loan.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{loan.lender || "Lender not set"}</p>
                      </>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="font-medium text-sm text-muted-foreground">{formatCurrency(loan.principal)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Outstanding</p>
                    <p className="font-bold text-sm text-destructive">{formatCurrency(loan.outstanding)}</p>
                  </div>

                  {isEditing ? (
                    <button
                      onClick={() => handleEditSave(loan.id)}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold hover:opacity-90 shrink-0"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditStart(loan.id)}
                      className="p-1 hover:bg-primary/20 rounded transition-colors shrink-0"
                      title="Edit loan details"
                    >
                      <Pencil className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>

                {/* Display Mode: Details Grid */}
                {!isEditing && (
                  <div className="border-t border-white/10 pt-3 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">EMI / Month</span>
                      <p className="font-bold text-sm mt-1">{formatCurrency(loan.emiAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next EMI</span>
                      <p className="font-bold text-sm mt-1">{loan.nextEmiDate ? format(new Date(loan.nextEmiDate), "d MMM") : "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining</span>
                      <p className="font-bold text-sm mt-1">{loan.emiCount - loan.paidCount} months</p>
                    </div>
                  </div>
                )}

                {/* Edit Mode: All Fields */}
                {isEditing && (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    {/* Principal Amount */}
                    <div>
                      <label className="text-xs text-muted-foreground">Principal Amount</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">₹</span>
                        <input
                          type="number"
                          value={editPrincipal}
                          onChange={(e) => setEditPrincipal(e.target.value)}
                          className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                    </div>

                    {/* Outstanding Amount */}
                    <div>
                      <label className="text-xs text-muted-foreground">Outstanding Amount</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">₹</span>
                        <input
                          type="number"
                          value={editOutstanding}
                          onChange={(e) => setEditOutstanding(e.target.value)}
                          className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                    </div>

                    {/* EMI Amount */}
                    <div>
                      <label className="text-xs text-muted-foreground">EMI Amount (Monthly)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">₹</span>
                        <input
                          type="number"
                          value={editEMI}
                          onChange={(e) => setEditEMI(e.target.value)}
                          className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                    </div>

                    {/* Remaining Months */}
                    <div>
                      <label className="text-xs text-muted-foreground">Remaining Months</label>
                      <input
                        type="number"
                        min="0"
                        value={editRemainingMonths}
                        onChange={(e) => setEditRemainingMonths(e.target.value)}
                        className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none mt-1"
                      />
                    </div>

                    {/* Next EMI Date */}
                    <div>
                      <label className="text-xs text-muted-foreground">Next EMI Date</label>
                      <input
                        type="date"
                        value={editNextEmiDate}
                        onChange={(e) => setEditNextEmiDate(e.target.value)}
                        className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none mt-1"
                      />
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="border-t border-white/10 pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentSheetLoanId(loan.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-white/20 text-muted-foreground hover:bg-white/10 transition-colors"
                    >
                      <History className="w-3 h-3" /> History
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Button */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => !open && cancelArchiveLoan()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{loanPendingArchive?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Archived items will no longer appear in active lists.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelArchiveLoan}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmArchiveLoan} className="bg-destructive text-white hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        onClick={handleAddLoan}
        className="w-full py-3 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 rounded-xl text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> ADD NEW LOAN
      </button>

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
