import { ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface MasterListSectionProps {
  label: string;
  total: number;
  children: ReactNode;
  onAddNew?: () => void;
}

export function MasterListSection({ label, total, children, onAddNew }: MasterListSectionProps) {
  return (
    <section className="border-b border-white/10 pb-4">
      <div className="flex items-center justify-between gap-4 py-2">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
        </div>
        <div className="text-sm font-bold text-foreground">{formatCurrency(total)}</div>
      </div>
      <div className="divide-y divide-white/10 overflow-hidden rounded-none bg-transparent">
        {children}
      </div>
      {onAddNew ? (
        <button
          type="button"
          onClick={onAddNew}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/10"
        >
          <span className="font-bold">+</span>
          ADD NEW
        </button>
      ) : null}
    </section>
  );
}
