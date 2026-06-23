import { useState } from "react";
import { useStore, CreditCard } from "@/hooks/useStore";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";

export function CreditCardsTab() {
  const { store, updateStore } = useStore();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleUnbilledUpdate = (cardId: string, newUnbilled: number) => {
    updateStore((prev) => ({
      ...prev,
      creditCards: prev.creditCards.map((c) =>
        c.id === cardId ? { ...c, unbilled: Math.max(0, newUnbilled) } : c
      ),
    }));
  };

  const visibleCards = store.creditCards.filter((c) => !c.deleted);
  const totalLimit = visibleCards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalOutstanding = visibleCards.reduce((sum, c) => sum + c.outstanding, 0);
  const totalUnbilled = visibleCards.reduce((sum, c) => sum + (c.unbilled ?? 0), 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Summary */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">TOTAL AVAILABLE</span>
        <h2
          className={cn(
            "text-5xl font-bold tracking-tight mb-6",
            totalLimit - totalOutstanding - totalUnbilled >= 0 ? "text-primary neon-text" : "text-destructive"
          )}
        >
          {formatCurrency(totalLimit - totalOutstanding - totalUnbilled)}
        </h2>
        <div className="flex w-full justify-between px-4 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground uppercase mb-1">Credit Limit</span>
            <span className="text-[#34d399] font-medium">{formatCurrency(totalLimit)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground uppercase mb-1">Due Amount</span>
            <span className="text-destructive font-medium">{formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground uppercase mb-1">Unbilled</span>
            <span className="text-orange-400 font-medium">{formatCurrency(totalUnbilled)}</span>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {visibleCards.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground italic text-sm">
          No credit cards. Add one in Profile Menu → Edit & Add → Credit Card.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            const available = card.creditLimit - card.outstanding - (card.unbilled ?? 0);

            return (
              <div key={card.id} className="glass-card overflow-hidden">
                {/* Card Header - Click to expand */}
                <button
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  className="w-full text-left p-4 flex items-start justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{card.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.cardType || card.provider}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Limit / Available</p>
                      <p className={cn(
                        "font-bold text-sm",
                        available < 0 ? "text-destructive" : ""
                      )}>
                        {formatCurrency(card.creditLimit)} / {formatCurrency(Math.max(0, available))}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Card Details - Expandable */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Due Amount</span>
                        <p className={cn("font-bold text-sm mt-1", card.outstanding < 0 ? "text-destructive" : "text-destructive")}>{formatCurrency(card.outstanding)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date</span>
                        <p className="font-bold text-sm mt-1">{card.dueDate}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Unbilled (Auto-updated)</span>
                        <span className={cn("font-bold", (card.unbilled ?? 0) < 0 ? "text-destructive" : "text-orange-400")}>{formatCurrency(card.unbilled ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">₹</span>
                        <input
                          type="number"
                          value={card.unbilled ?? 0}
                          onChange={(e) =>
                            handleUnbilledUpdate(card.id, Number(e.target.value))
                          }
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <span className="text-xs text-muted-foreground">Next Bill Date</span>
                      <p className="font-bold text-sm mt-1">
                        {card.nextDueDate ? format(new Date(card.nextDueDate), "d MMM yyyy") : "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
