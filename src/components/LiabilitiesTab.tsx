import { formatCurrency } from "@/lib/utils";
import { useStore, CreditCard, Loan } from "@/hooks/useStore";
import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";



interface CreditCardRowProps {
  card: CreditCard;
  onUpdate: (id: string, field: string, val: any) => void;
}

function CreditCardRow({ card, onUpdate }: CreditCardRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-medium text-sm truncate">{card.name}</p>
        <p className="text-xs text-muted-foreground truncate">{card.provider}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-xs text-muted-foreground">Outstanding</p>
        <p className="text-destructive font-bold text-sm">{formatCurrency(card.outstanding)}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        <p className="text-xs text-muted-foreground">Available</p>
        <p className="text-[#34d399] font-bold text-sm">{formatCurrency(card.creditLimit - card.outstanding)}</p>
      </div>
    </div>
  );
}

interface SectionProps {
  label: string;
  total: number;
  children: React.ReactNode;
}

function Section({ label, total, children }: SectionProps) {
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
      {open && <div className="glass-card overflow-hidden px-4 pb-2 pt-1">{children}</div>}
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
      <h2 className="text-2xl font-bold text-foreground mb-2">Liabilities</h2>

      <Section label="Credit Cards" total={creditCardTotal}>
        {visibleCreditCards.length === 0 ? (
          <p className="text-muted-foreground text-xs py-3 text-center italic">No credit cards</p>
        ) : (
          visibleCreditCards.map((card) => <CreditCardRow key={card.id} card={card} onUpdate={() => {}} />)
        )}
      </Section>

      <Section label="Loans" total={loanTotal}>
        {visibleLoans.length === 0 ? (
          <p className="text-muted-foreground text-xs py-3 text-center italic">No loans</p>
        ) : (
          visibleLoans.map((loan) => (
            <div key={loan.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-sm truncate">{loan.name}</p>
                <p className="text-xs text-muted-foreground truncate">{loan.lender}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-destructive font-bold text-sm">{formatCurrency(loan.outstanding)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                <p className="text-xs text-muted-foreground">EMI</p>
                <p className="text-primary font-bold text-sm">{formatCurrency(loan.emiAmount)}</p>
              </div>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}
