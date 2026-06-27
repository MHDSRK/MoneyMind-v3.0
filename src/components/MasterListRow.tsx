import { formatCurrency } from "@/lib/utils";
import { SwipeableArchiveCard } from "@/components/SwipeableArchiveCard";

interface MasterListRowProps {
  name: string;
  amount: number | string;
  subtitle?: string;
  onClick: () => void;
  onArchive: () => void;
}

export function MasterListRow({ name, amount, subtitle, onClick, onArchive }: MasterListRowProps) {
  return (
    <SwipeableArchiveCard onArchive={onArchive} className="border-b border-white/10 bg-background">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-4 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-white/5"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p> : null}
        </div>
        <div className="text-sm font-semibold text-foreground">
          {typeof amount === "number" ? formatCurrency(amount) : amount}
        </div>
      </button>
    </SwipeableArchiveCard>
  );
}
