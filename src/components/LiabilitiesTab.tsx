import { formatCurrency } from "@/lib/utils";
import { useStore, CreditCard, Loan } from "@/hooks/useStore";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface SectionProps {
  label: string;
  total: number;
}

function Section({ label, total }: SectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold tracking-wider uppercase text-xs neon-text">{label}</span>
          <span className="text-destructive font-bold text-sm">{formatCurrency(total)}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="glass-card overflow-hidden px-4 pb-2 pt-1">
        <p className="text-muted-foreground text-xs py-3 text-center italic">
          Manage in Profile Menu → Edit & Add
        </p>
      </div>}
    </div>
  );
}

export function LiabilitiesTab() {
  const { store } = useStore();

  const visibleCreditCards = store.creditCards.filter((c) => !c.deleted);
  const visibleLoans = store.loans.filter((l) => !l.deleted);
  
  const creditCardTotal = visibleCreditCards.reduce((sum, c) => sum + c.outstanding, 0);
  const loanTotal = visibleLoans.reduce((sum, l) => sum + l.outstanding, 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-2">Others</h2>

      <Section label="Borrow" total={loanTotal} />
      <Section label="Other Liabilities" total={creditCardTotal} />
    </div>
  );
}
