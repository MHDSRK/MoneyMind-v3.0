import { useEffect, useRef, useState } from "react";
import { useStore, CreditCard, archiveRecord } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { createUnbilledTransaction } from "@/lib/transactionEffects";
import { getCreditCardAvailableAmount } from "@/lib/calculations";
import { MasterListSection } from "@/components/MasterListSection";
import { MasterListRow } from "@/components/MasterListRow";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";

export function CreditCardsTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [cardPendingArchive, setCardPendingArchive] = useState<CreditCard | null>(null);
  const [paymentSheetCardId, setPaymentSheetCardId] = useState<string | null>(null);
  const [quickAddCardId, setQuickAddCardId] = useState<string | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState("");
  const [quickAddNotes, setQuickAddNotes] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const visibleCards = store.creditCards.filter((card) => !card.deleted && !card.archivedAt);
  const totalLimit = visibleCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalOutstanding = visibleCards.reduce((sum, card) => sum + card.outstanding, 0);
  const totalUnbilled = visibleCards.reduce((sum, card) => sum + (card.unbilled ?? 0), 0);
  const totalAvailable = totalLimit - totalOutstanding - totalUnbilled;

  useEffect(() => {
    if (!location.startsWith("/cards")) return;

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) return;

    const target = store.creditCards.find((card) => card.id === focusId && !card.deleted);
    if (!target) return;

    setHighlightedId(focusId);
    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      cardRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.creditCards]);


  const promptArchiveCard = (card: CreditCard) => {
    setCardPendingArchive(card);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveCard = () => {
    if (!cardPendingArchive) return;

    updateStore((prev) => ({ ...prev, creditCards: archiveRecord(prev.creditCards, cardPendingArchive.id) }));
    toast({ title: "Card archived", description: "The card was archived and removed from active totals." });
    setArchiveDialogOpen(false);
    setCardPendingArchive(null);
  };

  const cancelArchiveCard = () => {
    setArchiveDialogOpen(false);
    setCardPendingArchive(null);
  };

  const openQuickAdd = (cardId: string) => {
    setQuickAddCardId(cardId);
    setQuickAddAmount("");
    setQuickAddNotes("");
  };

  const closeQuickAdd = () => setQuickAddCardId(null);

  const confirmQuickAdd = () => {
    if (!quickAddCardId) return;
    const amount = Number(quickAddAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive amount.", variant: "destructive" });
      return;
    }

    updateStore((prev) => createUnbilledTransaction(prev, quickAddCardId, amount, quickAddNotes));
    toast({ title: "Unbilled expense added", description: "Added to card unbilled total." });
    closeQuickAdd();
  };

  const cardAvailable = (card: CreditCard) => Math.max(0, getCreditCardAvailableAmount(card));

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Credit Cards</h2>
          <p className="text-sm text-muted-foreground">Tap a card to view details, swipe left to archive.</p>
        </div>
        <div className={totalAvailable < 0 ? "text-destructive text-2xl font-bold" : "text-primary neon-text text-2xl font-bold"}>
          {formatCurrency(totalAvailable)}
        </div>
      </div>

      <MasterListSection label="Credit Cards" total={totalAvailable}>
        {visibleCards.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">No active credit cards yet. Add one to begin.</div>
        ) : (
          visibleCards.map((card) => (
            <div
              key={card.id}
              ref={(element) => { cardRefs.current[card.id] = element; }}
              className={highlightedId === card.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
            >
              <MasterListRow
                name={card.name}
                subtitle={card.provider || card.cardType || "Credit card"}
                amount={cardAvailable(card)}
                onClick={() => setSelectedCard(card)}
                onArchive={() => promptArchiveCard(card)}
              />
            </div>
          ))
        )}
      </MasterListSection>

      <RecordDetailsDialog
        open={Boolean(selectedCard)}
        title={selectedCard?.name ?? "Card details"}
        description="Review credit card values and open payment history."
        details={
          selectedCard
            ? [
                { label: "Provider", value: selectedCard.provider || "Not set" },
                { label: "Card Type", value: selectedCard.cardType || "Not set" },
                { label: "Credit Limit", value: formatCurrency(selectedCard.creditLimit) },
                { label: "Outstanding", value: formatCurrency(selectedCard.outstanding) },
                { label: "Unbilled", value: formatCurrency(selectedCard.unbilled ?? 0) },
                { label: "Due Day", value: String(selectedCard.dueDate) },
                { label: "Next Bill", value: selectedCard.nextDueDate ? format(new Date(selectedCard.nextDueDate), "d MMM yyyy") : "Not set" },
              ]
            : []
        }
        actions={
          selectedCard ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => openQuickAdd(selectedCard.id)}
                className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/20"
              >
                Add Unbilled
              </button>
              <button
                type="button"
                onClick={() => setPaymentSheetCardId(selectedCard.id)}
                className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-foreground border border-white/10 hover:bg-white/10"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => promptArchiveCard(selectedCard)}
                className="rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-white hover:bg-destructive/90"
              >
                Archive
              </button>
            </div>
          ) : null
        }
        onClose={() => setSelectedCard(null)}
      >
        {selectedCard ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Available</p>
              <p className="mt-2 text-3xl font-semibold text-primary">{formatCurrency(cardAvailable(selectedCard))}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-destructive/80">Due Amount</p>
              <p className="mt-1 text-2xl font-semibold text-destructive">{formatCurrency(selectedCard.outstanding + (selectedCard.unbilled ?? 0))}</p>
            </div>
          </div>
        ) : null}
      </RecordDetailsDialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => !open && cancelArchiveCard()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{cardPendingArchive?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Archived cards will not be shown in active totals.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelArchiveCard}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmArchiveCard} className="bg-destructive text-white hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={Boolean(quickAddCardId)} onOpenChange={(open) => !open && closeQuickAdd()}>
        <SheetContent side="bottom" className="bg-[#0d1117] border-t border-white/10 rounded-t-2xl p-0 flex flex-col" style={{ height: "42vh", maxHeight: "42vh" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">Add Unbilled Expense</span>
            <button onClick={closeQuickAdd} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Amount</label>
              <input
                type="number"
                value={quickAddAmount}
                onChange={(event) => setQuickAddAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Note</label>
              <textarea
                value={quickAddNotes}
                onChange={(event) => setQuickAddNotes(event.target.value)}
                placeholder="Optional note"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 p-4">
            <button
              type="button"
              onClick={closeQuickAdd}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmQuickAdd}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {paymentSheetCardId && (() => {
        const card = store.creditCards.find((c) => c.id === paymentSheetCardId);
        if (!card) return null;
        return (
          <PaymentHistorySheet
            open
            onClose={() => setPaymentSheetCardId(null)}
            entityType="credit-card"
            entityId={card.id}
            entityName={card.name}
            outstanding={card.outstanding}
          />
        );
      })()}
    </div>
  );
}
