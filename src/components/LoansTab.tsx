import { formatCurrency, cn } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export function LoansTab() {
  const { store, updateStore } = useStore();
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLender, setEditLender] = useState("");
  const [editPrincipal, setEditPrincipal] = useState("");
  const [editEMI, setEditEMI] = useState("");
  const editNameRef = useRef<HTMLInputElement>(null);
  const editLenderRef = useRef<HTMLInputElement>(null);
  const editPrincipalRef = useRef<HTMLInputElement>(null);
  const editEMIRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

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
      setEditEMI(loan.emiAmount.toString());
    }
  };

  const handleEditSave = (loanId: string) => {
    updateStore((prev) => ({
      ...prev,
      loans: prev.loans.map((l) =>
        l.id === loanId ? {
          ...l,
          name: editName,
          lender: editLender,
          principal: parseInt(editPrincipal) || 0,
          emiAmount: parseInt(editEMI) || 0,
          outstanding: parseInt(editPrincipal) || 0,
        } : l
      ),
    }));
    setEditingLoanId(null);
  };

  const handleLongPress = (e: React.MouseEvent, loanId: string) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      handleEditStart(loanId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const visibleLoans = store.loans.filter((l) => !l.deleted);
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
              <div 
                key={loan.id} 
                className="glass-card p-4 space-y-2"
                onMouseDown={(e) => handleLongPress(e, loan.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={(e) => handleLongPress(e as any, loan.id)}
                onTouchEnd={handleLongPressEnd}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      ref={editNameRef}
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(loan.id)}
                      className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm text-foreground outline-none font-bold"
                    />
                    <input 
                      ref={editLenderRef}
                      type="text" 
                      value={editLender}
                      onChange={(e) => setEditLender(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(loan.id)}
                      placeholder="Lender"
                      className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                    />
                    <input 
                      ref={editPrincipalRef}
                      type="number" 
                      value={editPrincipal}
                      onChange={(e) => setEditPrincipal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(loan.id)}
                      placeholder="Principal Amount"
                      className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                    />
                    <input 
                      ref={editEMIRef}
                      type="number" 
                      value={editEMI}
                      onChange={(e) => setEditEMI(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(loan.id)}
                      placeholder="EMI Amount"
                      className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                    />
                    <button
                      onClick={() => handleEditSave(loan.id)}
                      className="w-full bg-primary text-primary-foreground text-xs font-bold py-1 rounded hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{loan.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(loan.principal)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Outstanding</span>
                        <p className={cn("font-bold", loan.outstanding < 0 ? "text-destructive" : "text-destructive")}>{formatCurrency(loan.outstanding)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">EMI/Month</span>
                        <p className="text-primary font-bold">{formatCurrency(loan.emiAmount)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next EMI</span>
                        <p className="text-sm">{loan.nextEmiDate ? format(new Date(loan.nextEmiDate), "d MMM") : "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining</span>
                        <p className="text-sm">{loan.emiCount - loan.paidCount} months</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Button */}
      <button
        onClick={handleAddLoan}
        className="w-full py-3 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 rounded-xl text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> ADD NEW LOAN
      </button>
    </div>
  );
}
