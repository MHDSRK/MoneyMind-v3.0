import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { useStore, Transaction, deleteTransactionFromStore, restoreTransactionFromStore, updateTransactionInStore } from "@/hooks/useStore";
import { createTransaction } from "@/lib/transactionEffects";
import { isTrackingTransaction } from "@/lib/calculations";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";

type TransactionMode = "in" | "out" | "self";

export function TodayTab() {
  const { store, updateStore } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [txType, setTxType] = useState<TransactionMode | null>(null);
  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaysTx = store.transactions.filter(
    (t) => !t.deleted && !t.archivedAt && t.date.startsWith(todayStr) && !isTrackingTransaction(t)
  );

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

  const visibleAccounts = store.accounts.filter((account) => !account.deleted && !account.archivedAt);
  const visibleCreditCards = store.creditCards.filter((card) => !card.deleted && !card.archivedAt);
  const moneyInCategories = store.categories
    .filter((categoryItem) => categoryItem.type === "in" && !categoryItem.deleted)
    .map((categoryItem) => categoryItem.name);
  const moneyOutCategories = store.categories
    .filter((categoryItem) => categoryItem.type === "out" && !categoryItem.deleted)
    .map((categoryItem) => categoryItem.name);

  const resetTransactionForm = () => {
    setSheetOpen(false);
    setEditingTransaction(null);
    setTxType(null);
    setAmount("");
    setLedger("");
    setFromAccountId("");
    setToAccountId("");
    setCategory("");
    setNotes("");
  };

  const openTransactionEditor = (transaction?: Transaction) => {
    if (!transaction) {
      resetTransactionForm();
      return;
    }

    const mode: TransactionMode = transaction.type === "transfer" ? "self" : transaction.type;
    setEditingTransaction(transaction);
    setTxType(mode);
    setAmount(String(transaction.amount));
    setLedger(transaction.ledger || "");
    setFromAccountId(transaction.fromAccountId || transaction.fromCardId || "");
    setToAccountId(transaction.toAccountId || transaction.toCardId || "");
    setCategory(transaction.category || "");
    setNotes(transaction.notes || "");
    setSheetOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!amount || !ledger || !category || !txType) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive amount.", variant: "destructive" });
      return;
    }

    const isSelfTransfer = txType === "self";
    const selectedFromAccountId = visibleAccounts.find((account) => account.id === fromAccountId)?.id;
    const selectedToAccountId = visibleAccounts.find((account) => account.id === toAccountId)?.id;
    const selectedFromCardId = visibleCreditCards.find((card) => card.id === fromAccountId)?.id;
    const selectedToCardId = visibleCreditCards.find((card) => card.id === toAccountId)?.id;
    const sourceAccount = visibleAccounts.find((account) => account.id === selectedFromAccountId);
    const destinationAccount = visibleAccounts.find((account) => account.id === selectedToAccountId);
    const sourceCard = visibleCreditCards.find((card) => card.id === selectedFromCardId);
    const destinationCard = visibleCreditCards.find((card) => card.id === selectedToCardId);
    const sourceName = txType === "out"
      ? (sourceAccount?.name ?? sourceCard?.name ?? "")
      : txType === "self"
        ? (sourceAccount?.name ?? "")
        : undefined;
    const destinationName = txType === "in"
      ? (destinationAccount?.name ?? destinationCard?.name ?? "")
      : txType === "self"
        ? (destinationAccount?.name ?? "")
        : undefined;
    const ledgerLabel = isSelfTransfer
      ? `Self transfer: ₹${parsedAmount} from ${sourceAccount?.name ?? ""} to ${destinationAccount?.name ?? ""}`
      : ledger.trim();

    const nextTransaction: Transaction = {
      id: editingTransaction?.id ?? crypto.randomUUID(),
      date: editingTransaction?.date ?? todayStr,
      type: isSelfTransfer ? "transfer" : txType,
      amount: parsedAmount,
      fromAccount: txType === "out" ? sourceName : txType === "self" ? sourceAccount?.name : undefined,
      toAccount: txType === "in" ? destinationName : txType === "self" ? destinationAccount?.name : undefined,
      fromAccountId: txType === "out" || txType === "self" ? selectedFromAccountId : undefined,
      fromCardId: txType === "out" ? selectedFromCardId : undefined,
      toAccountId: txType === "in" || txType === "self" ? selectedToAccountId : undefined,
      toCardId: txType === "in" ? selectedToCardId : undefined,
      ledger: ledgerLabel,
      category: isSelfTransfer ? "Self Transfer" : category,
      notes,
      tags: [],
      createdAt: editingTransaction?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTransaction) {
      updateStore((prev) => updateTransactionInStore(prev, editingTransaction, nextTransaction));
      toast({ title: "Transaction updated", description: "The transaction details were saved." });
    } else {
      updateStore((prev) => createTransaction(prev, nextTransaction));
      toast({ title: "Transaction added", description: "Your update was recorded instantly." });
    }

    resetTransactionForm();
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (!transactionToDelete) return;

    updateStore((prev) => deleteTransactionFromStore(prev, transactionToDelete));
    toast({
      title: "Transaction deleted",
      description: "The transaction was removed and its balance impact was reversed.",
      action: (
        <ToastAction
          altText="Undo transaction deletion"
          onClick={() => {
            updateStore((prev) => restoreTransactionFromStore(prev, transactionToDelete));
            toast({ title: "Transaction restored", description: "The transaction was restored successfully." });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const cancelDeleteTransaction = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    openTransactionEditor(transaction);
  };

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
              <div key={tx.id} className="flex items-center px-4 py-3 gap-2">
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

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEditTransaction(tx)}
                    className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-primary/80"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(tx)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-destructive transition hover:bg-destructive/10 hover:text-destructive/90"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !open && cancelDeleteTransaction()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteTransaction}>Cancel</AlertDialogCancel>
              <AlertDialogAction type="button" onClick={confirmDeleteTransaction} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Totals row */}
        <div className="flex items-center px-4 py-3 border-t border-white/10 bg-white/5 font-bold">
          <div className="flex-1 text-muted-foreground uppercase text-[10px] tracking-wider">Totals</div>
          <div className="w-24 text-right text-[#34d399] text-sm">{formatCurrency(todayIn)}</div>
          <div className="w-24 text-right text-destructive text-sm">{formatCurrency(todayOut)}</div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : resetTransactionForm())}>
        <SheetContent side="bottom" className="bg-[#0d1117] border-t border-white/10 rounded-t-2xl p-0 flex flex-col" style={{ height: "70vh", maxHeight: "70vh" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {editingTransaction ? "Edit Transaction" : "Record Transaction"}
            </span>
            <span className={cn("text-sm font-bold uppercase tracking-wider", txType === "in" ? "text-[#34d399]" : txType === "out" ? "text-destructive" : "text-primary") }>
              {txType === "in" ? "Money In" : txType === "out" ? "Money Out" : txType === "self" ? "Self Transfer" : "Choose Type"}
            </span>
          </div>

          {!txType ? (
            <div className="flex-1 px-5 py-4 space-y-3">
              <button onClick={() => setTxType("in")} className="w-full flex items-center justify-between rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 p-3 text-left text-sm font-semibold text-[#34d399]">
                <span className="flex items-center gap-2"><ArrowDownToLine className="w-4 h-4" /> Money In</span>
                <span className="text-xs text-muted-foreground">Income / payment received</span>
              </button>
              <button onClick={() => setTxType("out")} className="w-full flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-left text-sm font-semibold text-destructive">
                <span className="flex items-center gap-2"><ArrowUpFromLine className="w-4 h-4" /> Money Out</span>
                <span className="text-xs text-muted-foreground">Expense / payment made</span>
              </button>
              <button onClick={() => setTxType("self")} className="w-full flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-3 text-left text-sm font-semibold text-primary">
                <span className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Self Transfer</span>
                <span className="text-xs text-muted-foreground">Move money between accounts</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden px-5">
              <div className="flex-1 overflow-y-auto space-y-3 pt-3 pb-2">
                <div className="flex items-center gap-1 border-b border-white/10 pb-3">
                  <span className="text-2xl font-light text-muted-foreground">₹</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus className="bg-transparent text-3xl font-bold w-full focus:outline-none placeholder:text-muted-foreground/30" />
                </div>

                {txType === "in" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Select Account or Card</label>
                    <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm">
                      <option value="" disabled>Select Account or Card</option>
                      {visibleAccounts.map((account) => (<option key={account.id} value={account.id}>{account.name}</option>))}
                      {visibleCreditCards.map((card) => (<option key={card.id} value={card.id}>💳 {card.name}</option>))}
                    </select>
                  </div>
                )}

                {txType === "out" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Select Account or Card</label>
                    <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm">
                      <option value="" disabled>Select Account or Card</option>
                      {visibleAccounts.map((account) => (<option key={account.id} value={account.id}>{account.name}</option>))}
                      {visibleCreditCards.map((card) => (<option key={card.id} value={card.id}>💳 {card.name}</option>))}
                    </select>
                  </div>
                )}

                {txType === "self" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">From Account</label>
                      <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm">
                        <option value="" disabled>Select Source Account</option>
                        {visibleAccounts.map((account) => (<option key={account.id} value={account.id}>{account.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">To Account</label>
                      <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 appearance-none focus:outline-none focus:border-primary transition-all text-foreground text-sm">
                        <option value="" disabled>Select Destination Account</option>
                        {visibleAccounts.map((account) => (<option key={account.id} value={account.id}>{account.name}</option>))}
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Ledger / Name</label>
                  <input type="text" value={ledger} onChange={(e) => setLedger(e.target.value)} placeholder="E.g. Salary, Groceries..." className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-all text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Category</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(txType === "in" ? moneyInCategories : moneyOutCategories).map((cat) => (
                      <button key={cat} onClick={() => setCategory(cat)} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all", category === cat ? "bg-primary text-primary-foreground border-primary shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5")}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-all text-sm min-h-[80px]" />
                </div>
              </div>

              <div className="pt-2 pb-4">
                <button onClick={handleSaveTransaction} disabled={!amount || !ledger || !category || (txType === "self" && (!fromAccountId || !toAccountId || fromAccountId === toAccountId))} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)] disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]">
                  {editingTransaction ? "Update Transaction" : "Save Transaction"}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
