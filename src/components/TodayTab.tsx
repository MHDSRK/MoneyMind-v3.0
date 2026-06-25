import { formatCurrency, cn } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { format } from "date-fns";

export function TodayTab() {
  const { store } = useStore();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaysTx = store.transactions.filter((t) => !t.deleted && t.date.startsWith(todayStr));

  const getAccountName = (
    accountId?: string,
    legacyAccountName?: string
  ) => {
    return (
      store.accounts.find((account) => account.id === accountId)?.name ??
      legacyAccountName ??
      "Unknown account"
    );
  };

  const todayIn = todaysTx.filter((t) => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const todayOut = todaysTx.filter((t) => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayIn - todayOut;

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-foreground">Today's Cash Flow</h2>
        <span className="text-primary neon-text text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Header row */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="flex-1">Ledger</div>
          <div className="w-24 text-right whitespace-nowrap">Money In</div>
          <div className="w-24 text-right whitespace-nowrap">Money Out</div>
        </div>

        {todaysTx.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic text-sm">
            No transactions today
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {todaysTx.map((tx) => (
              <div key={tx.id} className="flex items-center px-4 py-3">
                <div className="flex-1 flex flex-col min-w-0 pr-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {tx.type === "transfer"
                      ? `Self Transfer : ${formatCurrency(tx.amount)}`
                      : tx.ledger || tx.category || "Transaction"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {tx.type === "transfer"
                      ? `From ${getAccountName(
                          tx.fromAccountId,
                          tx.fromAccount
                        )} to ${getAccountName(tx.toAccountId, tx.toAccount)}`
                      : tx.notes ||
                        tx.account ||
                        tx.fromAccount ||
                        tx.toAccount ||
                        ""}
                  </p>
                </div>

                <div className="w-24 text-right text-emerald-400 font-medium text-sm">
                  {tx.type === "in" ? formatCurrency(tx.amount) : "₹0.00"}
                </div>

                <div className="w-24 text-right text-red-400 font-medium text-sm">
                  {tx.type === "out" ? formatCurrency(tx.amount) : "₹0.00"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals row */}
        <div className="flex items-center px-4 py-3 border-t border-white/10 bg-white/5 font-bold">
          <div className="flex-1 text-muted-foreground uppercase text-[10px] tracking-wider">Totals</div>
          <div className="w-24 text-right text-[#34d399] text-sm">{formatCurrency(todayIn)}</div>
          <div className="w-24 text-right text-destructive text-sm">{formatCurrency(todayOut)}</div>
        </div>
      </div>

      {/* Today's Net */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">
          TODAY'S NET
        </span>
        <h3
          className={cn(
            "text-3xl font-bold tracking-tight",
            todayNet >= 0 ? "text-primary neon-text" : "text-destructive"
          )}
        >
          {formatCurrency(todayNet)}
        </h3>
      </div>
    </div>
  );
}
