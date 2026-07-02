import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { createTransaction } from "@/lib/transactionEffects";
import { getPaymentHistory, getTotalPaid } from "@/lib/paymentHistory";
import { formatCurrency } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, History, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatAppDate } from "@/utils/date";

interface PaymentHistorySheetProps {
  open: boolean;
  onClose: () => void;
  entityType: "loan" | "credit-card" | "liability";
  entityId: string;
  entityName: string;
  /** If provided, shown as the outstanding balance */
  outstanding?: number;
  /** Default payment amount, e.g. EMI */
  defaultAmount?: number;
}

export function PaymentHistorySheet({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  outstanding,
  defaultAmount,
}: PaymentHistorySheetProps) {
  const { store, updateStore } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(defaultAmount?.toString() ?? "");
  const [fromAccountId, setFromAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  const history = getPaymentHistory(store, entityType, entityId);
  const totalPaid = getTotalPaid(store, entityType, entityId);

  const visibleAccounts = store.accounts.filter((a) => !a.deleted && !a.archivedAt);

  const handleRecord = () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (!fromAccountId) {
      toast({ title: "Select a source account", variant: "destructive" });
      return;
    }

    const sourceAccount = visibleAccounts.find((a) => a.id === fromAccountId);
    const entityLabel =
      entityType === "loan"
        ? "Loan"
        : entityType === "credit-card"
        ? "Card"
        : "Liability";

    updateStore((prev) =>
      createTransaction(prev, {
        id: crypto.randomUUID(),
        date: payDate,
        type: "out",
        amount: amt,
        ledger: `${entityLabel} Payment: ${entityName}`,
        category: entityType === "loan" ? "Loan Payment" : entityType === "credit-card" ? "Credit Card Payment" : "Liability Payment",
        fromAccount: sourceAccount?.name,
        fromAccountId: sourceAccount?.id,
        notes,
        tags: [],
        relatedEntityType: entityType,
        relatedEntityId: entityId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    toast({ title: "Payment recorded", description: `${formatCurrency(amt)} payment logged.` });
    setShowForm(false);
    setAmount(defaultAmount?.toString() ?? "");
    setFromAccountId("");
    setNotes("");
    setPayDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[85dvh] flex flex-col p-0 rounded-t-2xl bg-[#0d0e14] border-t border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground leading-tight">{entityName}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {history.length} payments · Total paid {formatCurrency(totalPaid)}
                {outstanding != null && ` · Outstanding ${formatCurrency(outstanding)}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Record Payment Form */}
        {showForm ? (
          <div className="px-5 py-4 border-b border-white/10 bg-black/20 shrink-0 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Record Payment</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Amount</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  onFocus={(event) => event.currentTarget.showPicker?.()}
                  onKeyDown={(event) => {
                    if (event.key === "Tab" || event.key === "Escape") return;
                    event.preventDefault();
                  }}
                  onPaste={(event) => event.preventDefault()}
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase">From Account</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary appearance-none"
              >
                <option value="">Select account…</option>
                {visibleAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                placeholder="e.g. EMI #5"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRecord}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              >
                Save Payment
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 bg-white/10 text-muted-foreground py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 shrink-0">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        )}

        {/* Payment History List */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground italic text-sm">
              No payments recorded yet
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.notes || tx.ledger || "Payment"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatAppDate(tx.date)}
                      {tx.fromAccount && ` · ${tx.fromAccount}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-destructive shrink-0 ml-3">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
