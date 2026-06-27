import { formatCurrency } from "@/lib/utils";
import { SwipeableArchiveCard } from "@/components/SwipeableArchiveCard";

interface MasterListRowProps {
  name: string;
  amount: number | string;
  subtitle?: string;
  onClick: () => void;
  onArchive: () => void;
  interactive?: boolean;
  amountClassName?: string;
  secondaryText?: string;
  secondaryTextClassName?: string;
}

export function MasterListRow({
  name,
  amount,
  subtitle,
  onClick,
  onArchive,
  interactive = true,
  amountClassName = "text-foreground",
  secondaryText,
  secondaryTextClassName = "text-muted-foreground",
}: MasterListRowProps) {
  const content = (
    <div className="w-full px-4 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-white/5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        {subtitle ? <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p> : null}
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${amountClassName}`}>
          {typeof amount === "number" ? formatCurrency(amount) : amount}
        </div>
        {secondaryText ? <div className={`mt-1 text-[11px] ${secondaryTextClassName}`}>{secondaryText}</div> : null}
      </div>
    </div>
  );

  return (
    <SwipeableArchiveCard onArchive={onArchive} className="border-b border-white/10 bg-background">
      {interactive ? (
        <button type="button" onClick={onClick} className="w-full text-left">
          {content}
        </button>
      ) : (
        <div className="w-full text-left">{content}</div>
      )}
    </SwipeableArchiveCard>
  );
}
