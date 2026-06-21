import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { useStore, Transaction, LiabilityItem, LendItem } from "@/hooks/useStore";
import { Plus, ArrowDownToLine, ArrowUpFromLine, X, CalendarClock } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { parseISO, format, differenceInCalendarDays } from "date-fns";

export function HomeTab() {
  const { store, updateStore } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState<"in" | "out" | null>(null);

  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");

  // Net Liquidity: accounts-group assets minus all liabilities (Borrows included)
  const totalAssets = store.accounts
    .filter((a) => a.group === "accounts")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = store.liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netLiquidity = totalAssets - totalLiabilities;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysTx = store.transactions.filter((t) => t.date.startsWith(todayStr));
  const todayIn = todaysTx.filter((t) => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const todayOut = todaysTx.filter((t) => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayIn - todayOut;

  // Upcoming dues: liabilities with dueDate within next 5 days and amount > 0
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingDues = store.liabilities
    .filter((l) => {
      if (!l.dueDate || l.amount <= 0) return false;
      try {
        const diff = differenceInCalendarDays(parseISO(l.dueDate), today);
        return diff >= 0 && diff <= 5;
      } catch { return false; }
    })
    .sort((a, b) => {
      try { return differenceInCalendarDays(parseISO(a.dueDate), parseISO(b.dueDate)); }
      catch { return 0; }
    });

  const handleSave = () => {
    if (!amount || !ledger || !account || !category || !txType) return;
    const amt = Number(amount);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ledger, amount: amt, type: txType, category, account,
    };

    updateStore((prev) => {
      let next = { ...prev, transactions: [...prev.transactions, newTx] };

      // Update the selected account balance
      next = {
        ...next,
        accounts: next.accounts.map((a) =>
          a.name === account
            ? { ...a, balance: a.balance + (txType === "in" ? amt : -amt) }
            : a
        ),
      };

      // Money In + Borrow → real liability under "Borrows" (counts in total)
      if (txType === "in" && category === "Borrow") {
        const borrowEntry: LiabilityItem = {
          id: crypto.randomUUID(),
          group: "Borrows",
          name: ledger,
          amount: amt,
          dueDate: "",
        };
        next = { ...next, liabilities: [...next.liabilities, borrowEntry] };
      }

      // Money Out + Lent → tracking entry in lends (Assets tab, not in any total)
      if (txType === "out" && category === "Lent") {
        const lendEntry: LendItem = {
          id: crypto.randomUUID(),
          name: ledger,
          amount: amt,
          date: new Date().toISOString().split("T")[0],
        };
        next = { ...next, lends: [...next.lends, lendEntry] };
      }

      return next;
    });

    setAmount(""); setLedger(""); setAccount(""); setCategory("");
    setTxType(null); setSheetOpen(false);
  };

  const handleClose = () => {
    setSheetOpen(false); setTxType(null);
    setAmount(""); setLedger(""); setAccount(""); setCategory("");
  };

  const moneyInCategories = ["Income", "Borrow", "Repayment", "Company"];
  const moneyOutCategories = ["Home Expenses", "Lent", "Repayment", "Company", "Others"];

  const accountSelect = (
    <select
      value={account}
      onChange={(e) => setAccount(e.target.value)}
      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
    >
      <option value="" disabled>Select Account</option>
      <optgroup label="Accounts">
        {store.accounts.filter(a => a.group === "accounts").map(a => (
          <option key={a.name} value={a.name}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="Credit Cards">
        {store.accounts.filter(a => a.group === "credit-cards").map(a => (
          <option key={a.name} value={a.name}>{a.name}</option>
        ))}
      </optgroup>
    </select>
  );

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Net Liquidity card */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">NET LIQUIDITY</span>
        <h2
          style={{ background: "transparent" }}
          className={cn("text-5xl font-bold tracking-tight mb-6 bg-transparent",
            netLiquidity >= 0 ? "text-primary neon-text" : "text-destructive")}
        >
          {formatCurrency(netLiquidity)}
        </h2>
        <div className="flex w-full justify-between px-4">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Assets</span>
            <span className="text-[#34d399] font-medium">{formatCurrency(totalAssets)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Liabilities</span>
            <span className="text-destructive font-medium">{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* Today card */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">TODAY</span>
        <h3 className={cn("text-3xl font-bold tracking-tight",
          todayNet >= 0 ? "text-primary neon-text" : "text-destructive")}>
          {formatCurrency(todayNet)}
        </h3>
      </div>

      {/* Upcoming Dues card */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/5">
          <CalendarClock className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary neon-text">Upcoming Dues</span>
          <span className="ml-1 text-[10px] text-muted-foreground">(next 5 days)</span>
        </div>
        {upcomingDues.length === 0 ? (
          <div className="px-4 py-5 text-center text-muted-foreground italic text-sm">
            No dues in the next 5 days
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {upcomingDues.map((l) => {
              const daysLeft = differenceInCalendarDays(parseISO(l.dueDate), today);
              return (
                <div key={l.id} className="flex items-center px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {daysLeft === 0 ? "Due today" : daysLeft === 1 ? "Tomorrow" : `In ${daysLeft} days`}
                      {" · "}{format(parseISO(l.dueDate), "d MMM")}
                    </p>
                  </div>
                  <span className={cn("font-bold text-sm shrink-0",
                    daysLeft === 0 ? "text-destructive" : "text-orange-400")}>
                    {formatCurrency(l.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setSheetOpen(true)}
          data-testid="button-add-transaction"
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="bg-[#0d1117] border-t border-white/10 rounded-t-2xl p-0 flex flex-col"
          style={{ height: "52vh", maxHeight: "52vh" }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
            {!txType ? (
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Record Transaction</span>
            ) : (
              <span className={cn("text-sm font-bold uppercase tracking-wider",
                txType === "in" ? "text-[#34d399]" : "text-destructive")}>
                {txType === "in" ? "Money In" : "Money Out"}
              </span>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {!txType ? (
            <div className="flex gap-3 px-5 pt-5">
              <button onClick={() => setTxType("in")} data-testid="button-money-in"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] font-bold text-sm hover:bg-[#34d399]/20 active:scale-95 transition-all">
                <ArrowDownToLine className="w-4 h-4" /> Money In
              </button>
              <button onClick={() => setTxType("out")} data-testid="button-money-out"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/20 active:scale-95 transition-all">
                <ArrowUpFromLine className="w-4 h-4" /> Money Out
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden px-5">
              <div className="flex-1 overflow-y-auto space-y-3 pt-3 pb-2">
                <div className="flex items-center gap-1 border-b border-white/10 pb-3">
                  <span className="text-2xl font-light text-muted-foreground">₹</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" autoFocus
                    className="bg-transparent text-3xl font-bold w-full focus:outline-none placeholder:text-muted-foreground/30" />
                </div>

                {txType === "in" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Select Account</label>
                    {accountSelect}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Ledger / Name</label>
                  <input type="text" value={ledger} onChange={(e) => setLedger(e.target.value)}
                    placeholder="E.g. Salary, Groceries..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-all text-sm" />
                </div>

                {txType === "out" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Select Account</label>
                    {accountSelect}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Category</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(txType === "in" ? moneyInCategories : moneyOutCategories).map((cat) => (
                      <button key={cat} onClick={() => setCategory(cat)}
                        className={cn("px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all",
                          category === cat
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                            : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5")}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 pb-4">
                <button onClick={handleSave} disabled={!amount || !ledger || !account || !category}
                  data-testid="button-save-transaction"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)] disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]">
                  Save Transaction
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
