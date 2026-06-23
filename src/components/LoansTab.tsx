import { formatCurrency, cn } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { format } from "date-fns";

export function LoansTab() {
  const { store } = useStore();

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
          No loans. Add one in Profile Menu → Edit & Add → Loans.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLoans.map((loan) => (
            <div key={loan.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">{loan.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(loan.principal)} principal</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
