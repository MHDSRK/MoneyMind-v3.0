import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  useStore,
  Transaction,
  TransactionType,
  DEFAULT_MONEY_IN_CATEGORY_NAMES,
  DEFAULT_MONEY_OUT_CATEGORY_NAMES,
  addCustomCategory,
  processUpcomingDuePayment,
} from "@/hooks/useStore";
import { calculateMetrics, getUpcomingDues } from "@/lib/calculations";
import { createTransaction } from "@/lib/transactionEffects";
import { Plus, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, X, CalendarClock } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatAppDate } from "@/utils/date";
import { SwipeableArchiveCard } from "@/components/SwipeableArchiveCard";

type TransactionMode = "in" | "out" | "self";

/* Literal union types for categories used across the UI and strict handlers. */
type MoneyInCategory = "Income" | "Borrow" | "Business" | "Lent Pay Back" | "Others";
type MoneyOutCategory = "Lent" | "Business" | "Others" | "Home Build" | "Personal" | "Travel" | "Medicine";

export function HomeTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const focusId = new URLSearchParams(location.split("?")[1] ?? "").get("focus");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionMode | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  /* category state typed to allow literal categories but still accept custom store names; validated before save */
  const [category, setCategory] = useState<MoneyInCategory | MoneyOutCategory | string>("");
  const [notes, setNotes] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Calculate all financial metrics, excluding tracking-only items.
  const financialMetrics = calculateMetrics(store);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNet = financialMetrics.todayIncome - financialMetrics.todayExpense;

  const upcomingDues = getUpcomingDues(store);
  const [payOpenId, setPayOpenId] = useState<string | null>(null);
  const [payFromAccountId, setPayFromAccountId] = useState<string>("");
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const visibleAccounts = store.accounts.filter((a) => !a.deleted && !a.archivedAt);
  const visibleCreditCards = store.creditCards.filter((c) => !c.deleted && !c.archivedAt);

  /* Build typed option arrays from the project's default category lists. */
  const moneyInOptions = Array.from(DEFAULT_MONEY_IN_CATEGORY_NAMES) as string[];
  const moneyOutOptions = Array.from(DEFAULT_MONEY_OUT_CATEGORY_NAMES) as string[];

  /* Type guards to validate runtime strings before passing them to strict functions. */
  function isMoneyInCategory(v: string): v is MoneyInCategory {
    return (moneyInOptions as string[]).includes(v);
  }
  function isMoneyOutCategory(v: string): v is MoneyOutCategory {
    return (moneyOutOptions as string[]).includes(v);
  }

  const moneyInCategories = store.categories
    .filter((c) => c.type === "in" && !c.deleted)
    .map((c) => c.name);
  const moneyOutCategories = store.categories
    .filter((c) => c.type === "out" && !c.deleted)
    .map((c) => c.name);

  const sortedMoneyInCategories = [
    ...moneyInOptions.filter((name) => moneyInCategories.includes(name)),
    ...moneyInCategories.filter((name) => !moneyInOptions.includes(name)),
  ] as string[];

  const sortedMoneyOutCategories = [
    ...moneyOutOptions.filter((name) => moneyOutCategories.includes(name)),
    ...moneyOutCategories.filter((name) => !moneyOutOptions.includes(name)),
  ] as string[];

  const moneyInSelect = (
    <select
      value={toAccountId}
      onChange={(e) => setToAccountId(e.target.value)}
      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
    >
      <option value="" disabled>
        Select Account or Card
      </option>
      {visibleAccounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
      {visibleCreditCards.map((c) => (
        <option key={c.id} value={c.id}>
          💳 {c.name}
        </option>
      ))}
    </select>
  );

  const moneyOutSelect = (
    <select
      value={fromAccountId}
      onChange={(e) => setFromAccountId(e.target.value)}
      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
    >
      <option value="" disabled>
        Select Account or Card
      </option>
      {visibleAccounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
      {visibleCreditCards.map((c) => (
        <option key={c.id} value={c.id}>
          💳 {c.name}
        </option>
      ))}
    </select>
  );

  /* Convert TransactionMode to the project's canonical TransactionType without unsafe casts. */
  function modeToTransactionType(m: TransactionMode): TransactionType {
    return m === "self" ? "transfer" : m;
  }

  const handleSave = () => {
    if (!amount || !ledger || !category || !txType) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const isSelfTransfer = txType === "self";
    const selectedFromAccountId = visibleAccounts.find((account) => account.id === fromAccountId)?.id;
    const selectedToAccountId = visibleAccounts.find((account) => account.id === toAccountId)?.id;
    const selectedFromCardId = visibleCreditCards.find((card) => card.id === fromAccountId)?.id;
    const selectedToCardId = visibleCreditCards.find((card) => card.id === toAccountId)?.id;
    const sourceAccount = visibleAccounts.find((account) => account.id === selectedFromAccountId);
    const destinationAccount = visibleAccounts.find((account) => account.id === selectedToAccountId);
    const sourceCard = visibleCreditCards.find((card) => card.id === selectedFromCardId);
    const sourceName = txType === "out"
      ? (sourceAccount?.name ?? sourceCard?.name ?? "")
      : txType === "self"
        ? (sourceAccount?.name ?? "")
        : undefined;
    const destinationName = txType === "in"
      ? (destinationAccount?.name ?? "")
      : txType === "self"
        ? (destinationAccount?.name ?? "")
        : undefined;
    const ledgerLabel = isSelfTransfer
      ? `Self transfer: ₹${amt} from ${sourceAccount?.name ?? ""} to ${destinationAccount?.name ?? ""}`
      : ledger;

    /* Validate category before saving. */
    if (!isSelfTransfer) {
      if (txType === "in" && !isMoneyInCategory(String(category))) {
        toast({ title: "Invalid category", description: "Please select a valid Money In category.", variant: "destructive" });
        return;
      }
      if (txType === "out" && !isMoneyOutCategory(String(category))) {
        toast({ title: "Invalid category", description: "Please select a valid Money Out category.", variant: "destructive" });
        return;
      }
    }

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: todayStr,
      type: isSelfTransfer ? "transfer" : modeToTransactionType(txType),
      amount: amt,
      fromAccount: txType === "out" ? sourceName : txType === "self" ? sourceAccount?.name : undefined,
      toAccount: txType === "in" ? destinationName : txType === "self" ? destinationAccount?.name : undefined,
      fromAccountId: txType === "out" || txType === "self" ? sourceAccount?.id : undefined,
      fromCardId: txType === "out" ? selectedFromCardId : undefined,
      toAccountId: txType === "in" || txType === "self" ? destinationAccount?.id : undefined,
      toCardId: txType === "in" ? selectedToCardId : undefined,
      ledger: ledgerLabel,
      category: txType === "self" ? "Self Transfer" : String(category),
      notes,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStore((prev) => createTransaction(prev, newTx));

    setAmount("");
    setLedger("");
    setFromAccountId("");
    setToAccountId("");
    setCategory("");
    setNotes("");
    setSelectedTags([]);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setTxType(null);
    setSheetOpen(false);
    toast({ title: "Transaction saved", description: "Your update was recorded instantly." });
  };

  const handleClose = () => {
    setSheetOpen(false);
    setTxType(null);
    setAmount("");
    setLedger("");
    setFromAccountId("");
    setToAccountId("");
    setCategory("");
    setNotes("");
    setSelectedTags([]);
  };

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Net Worth card */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">
          NET WORTH
        </span>
        <h2
          className={cn(
            "text-5xl font-bold tracking-tight mb-6",
            financialMetrics.netWorth >= 0
              ? "text-primary neon-text"
              : "text-destructive"
          )}
        >
          {formatCurrency(financialMetrics.netWorth)}
        </h2>
        <div className="flex w-full justify-between px-4">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">
              Assets
            </span>
            <span className="text-[#34d399] font-medium">
              {formatCurrency(financialMetrics.totalAssets)}
            </span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">
              Liabilities
            </span>
            <span className="text-destructive font-medium">
              {formatCurrency(financialMetrics.totalLiabilities)}
            </span>
          </div>
        </div>
      </div>

      {/* Today card */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">
          TODAY
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

      {/* Upcoming Dues card */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/5">
          <CalendarClock className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary neon-text">
            Upcoming Dues
          </span>
          <span className="ml-1 text-[10px] text-muted-foreground">
            (next 5 days)
          </span>
        </div>
        {upcomingDues.length === 0 ? (
          <div className="px-4 py-5 text-center text-muted-foreground italic text-sm">
            No dues in the next 5 days
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {upcomingDues.map((due) => (
              <div key={due.id}>
                <SwipeableArchiveCard
                  actionLabel="Mark as Paid"
                  actionClassName="bg-destructive/95"
                  revealWidth={112}
                  isOpen={openRowId === due.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setOpenRowId(due.id);
                      setPayOpenId(null);
                    } else if (openRowId === due.id) {
                      setOpenRowId(null);
                      setPayOpenId(null);
                    }
                  }}
                  onArchive={() => {
                    setPayOpenId(due.id);
                    setOpenRowId(due.id);
                  }}
                >
                  <div className="flex items-center px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{due.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {due.daysLeft === 0
                          ? "Due today"
                          : due.daysLeft === 1
                          ? "Tomorrow"
                          : `In ${due.daysLeft} days`}
                        {" · "}
                        {formatAppDate(due.nextDueDate)}
                      </p>
                    </div>
                    <span className={cn("font-bold text-sm shrink-0", "text-destructive")}>
                      {formatCurrency(due.dueAmount)}
                    </span>
                  </div>
                </SwipeableArchiveCard>

                {payOpenId === due.id && openRowId === due.id ? (
                  <div className="px-4 pb-3 pt-2 bg-black/10 border-b border-white/5">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Select Account</p>
                    <select
                      value={payFromAccountId}
                      onChange={(e) => setPayFromAccountId(e.target.value)}
                      className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
                    >
                      <option value="">Select Account or Card</option>
                      {store.accounts
                        .filter((a) => !a.deleted && !a.archivedAt && (a.type === "cash" || a.type === "bank"))
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({formatCurrency(a.balance)})
                          </option>
                        ))}
                    </select>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          const amt = due.dueAmount;
                          if (!payFromAccountId) {
                            toast({ title: "Select a source account", variant: "destructive" });
                            return;
                          }

                          const source = store.accounts.find((a) => a.id === payFromAccountId && !a.deleted && !a.archivedAt);
                          if (!source) {
                            toast({ title: "Select a valid source account", variant: "destructive" });
                            return;
                          }

                          if (typeof source.balance === "number" && source.balance < amt) {
                            toast({ title: "Insufficient balance in selected account", variant: "destructive" });
                            return;
                          }

                          updateStore((prev) =>
                            processUpcomingDuePayment(prev, {
                              entityType: due.entityType,
                              entityId: due.entityId,
                              fromAccountId: payFromAccountId,
                              amount: amt,
                            })
                          );

                          toast({ title: "Payment recorded", description: `${formatCurrency(amt)} paid.` });
                          setPayOpenId(null);
                          setPayFromAccountId("");
                          setOpenRowId(null);
                        }}
                        className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                      >
                        Pay {formatCurrency(due.dueAmount)}
                      </button>
                      <button
                        onClick={() => {
                          setPayOpenId(null);
                          setPayFromAccountId("");
                          setOpenRowId(null);
                        }}
                        className="px-4 bg-white/10 text-muted-foreground py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setSheetOpen(true)}
          data-testid="button-add-transaction"
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-a[...]"
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
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Record Transaction
              </span>
            ) : (
              <span
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  txType === "in"
                    ? "text-[#34d399]"
                    : "text-destructive"
                )}
              >
                {txType === "in" ? "Money In" : "Money Out"}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {!txType ? (
            <div className="flex gap-2 px-5 pt-5 flex-wrap">
              <button
                onClick={() => setTxType("in")}
                data-testid="button-money-in"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] font-bold text-sm hover:bg-[#34d399]/20"
              >
                <ArrowDownToLine className="w-4 h-4" /> Money In
              </button>
              <button
                onClick={() => setTxType("out")}
                data-testid="button-money-out"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/20"
              >
                <ArrowUpFromLine className="w-4 h-4" /> Money Out
              </button>
              <button
                onClick={() => setTxType("self")}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4" /> Self
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden px-5">
              <div className="flex-1 overflow-y-auto space-y-3 pt-3 pb-2">
                <div className="flex items-center gap-1 border-b border-white/10 pb-3">
                  <span className="text-2xl font-light text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="bg-transparent text-3xl font-bold w-full focus:outline-none placeholder:text-muted-foreground/30"
                  />
                </div>

                {txType === "in" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      Select Account
                    </label>
                    {moneyInSelect}
                  </div>
                )}

                {txType === "out" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                      Select Account or Card
                    </label>
                    {moneyOutSelect}
                  </div>
                )}

                {txType === "self" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                        From Account
                      </label>
                      <select
                        value={fromAccountId}
                        onChange={(e) => setFromAccountId(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
                      >
                        <option value="" disabled>Select Source Account</option>
                        {visibleAccounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                        To Account
                      </label>
                      <select
                        value={toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm"
                      >
                        <option value="" disabled>Select Destination Account</option>
                        {visibleAccounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                    Ledger / Name
                  </label>
                  <input
                    type="text"
                    value={ledger}
                    onChange={(e) => setLedger(e.target.value)}
                    placeholder="E.g. Salary, Groceries..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                    Category
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(txType === "in"
                      ? sortedMoneyInCategories
                      : sortedMoneyOutCategories
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all",
                          category === cat
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                            : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="px-3 py-1.5 rounded-full border border-dashed border-white/30 text-xs font-medium text-muted-foreground bg-transparent hover:bg-white/5 shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {showNewCategoryInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmedName = newCategoryName.trim();
                          if (!trimmedName) {
                            toast({ title: "Enter a category name", variant: "destructive" });
                            return;
                          }

                          const existingCategory = store.categories.some(
                            (categoryItem) =>
                              !categoryItem.deleted &&
                              categoryItem.type === txType &&
                              categoryItem.name.trim().toLowerCase() === trimmedName.toLowerCase(),
                          );

                          if (existingCategory) {
                            toast({ title: "Category already exists", variant: "destructive" });
                            return;
                          }

                          updateStore((prev) => addCustomCategory(prev, trimmedName, txType === "self" ? "out" : txType));

                          /* Only set the category in the UI if the newly added name matches the canonical literal lists. */
                          if (txType === "in" && isMoneyInCategory(trimmedName)) {
                            setCategory(trimmedName);
                          } else if (txType === "out" && isMoneyOutCategory(trimmedName)) {
                            setCategory(trimmedName);
                          } else {
                            toast({ title: "Category added", description: "Custom category saved but cannot be selected here due to type restrictions.", });
                          }

                          setNewCategoryName("");
                          setShowNewCategoryInput(false);
                        }}
                        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none[...]" />
                </div>
              </div>

              <div className="pt-2 pb-4">
                <button
                  onClick={handleSave}
                  disabled={!amount || !ledger || !category || (txType === "self" && (!fromAccountId || !toAccountId || fromAccountId === toAccountId))}
                  data-testid="button-save-transaction"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)] disabled:opacity-40 disabled:shadow-none transition[...]"
                >
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
