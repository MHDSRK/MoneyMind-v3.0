import { useState } from "react";
import { useStore, Loan } from "@/hooks/useStore";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Calendar, TrendingUp, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { format, addMonths } from "date-fns";

export function LoansTab() {
  const { store, updateStore } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    lender: "",
    principal: 0,
    interestRate: 0,
    emiAmount: 0,
    emiFrequency: "monthly" as const,
    emiCount: 60,
    startDate: format(new Date(), "yyyy-MM-dd"),
  });

  const handleSave = () => {
    if (!formData.name || formData.principal <= 0 || formData.emiAmount <= 0) return;

    const nextEmiDate = addMonths(new Date(formData.startDate), 1);

    const newLoan: Loan = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      lender: formData.lender,
      principal: formData.principal,
      interestRate: formData.interestRate,
      emiAmount: formData.emiAmount,
      emiFrequency: formData.emiFrequency,
      emiCount: formData.emiCount,
      paidCount: editingId ? (store.loans.find((l) => l.id === editingId)?.paidCount ?? 0) : 0,
      outstanding: formData.principal,
      startDate: formData.startDate,
      nextEmiDate: nextEmiDate.toISOString().split("T")[0],
      createdAt: editingId
        ? store.loans.find((l) => l.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    updateStore((prev) => {
      if (editingId) {
        return {
          ...prev,
          loans: prev.loans.map((l) => (l.id === editingId ? newLoan : l)),
        };
      }
      return { ...prev, loans: [...prev.loans, newLoan] };
    });

    setFormData({
      name: "",
      lender: "",
      principal: 0,
      interestRate: 0,
      emiAmount: 0,
      emiFrequency: "monthly",
      emiCount: 60,
      startDate: format(new Date(), "yyyy-MM-dd"),
    });
    setEditingId(null);
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => (l.id === id ? { ...l, deleted: true } : l)),
    }));
  };

  const visibleLoans = store.loans.filter((l) => !l.deleted);
  const totalOutstanding = visibleLoans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalEmiPerMonth = visibleLoans.reduce((sum, l) => 
    (l.emiFrequency === "monthly" ? sum + l.emiAmount : sum), 0
  );

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Summary */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">TOTAL OUTSTANDING</span>
        <h2 className="text-5xl font-bold tracking-tight mb-6 text-destructive">
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
          No loans. Tap the + button to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLoans.map((loan) => (
            <div key={loan.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">{loan.name}</p>
                  <p className="text-xs text-muted-foreground">{loan.lender}</p>
                </div>
                <button
                  onClick={() => handleDelete(loan.id)}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Outstanding</span>
                  <p className="text-destructive font-bold">{formatCurrency(loan.outstanding)}</p>
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
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            setEditingId(null);
            setSheetOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#0d1117] border-t border-white/10 rounded-t-2xl p-0"
          style={{ height: "auto", maxHeight: "70vh" }}
        >
          <div className="p-5 space-y-4 overflow-y-auto">
            <h2 className="text-lg font-bold">Add Loan</h2>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Loan Name"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <input
              type="text"
              value={formData.lender}
              onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
              placeholder="Lender Name"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <input
              type="number"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
              placeholder="Principal Amount"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <input
              type="number"
              value={formData.emiAmount}
              onChange={(e) => setFormData({ ...formData, emiAmount: Number(e.target.value) })}
              placeholder="EMI Amount"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl"
            >
              Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
