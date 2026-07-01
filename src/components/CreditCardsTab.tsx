import { useEffect, useRef, useState } from "react";
import { useStore, CreditCard, archiveRecord } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { createUnbilledTransaction } from "@/lib/transactionEffects";
import { getCreditCardAvailableAmount, getCreditCardDueAmount } from "@/lib/calculations";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";
import { formatDisplayDate } from "@/utils/date";

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
  const totalDue = visibleCards.reduce((sum, card) => sum + getCreditCardDueAmount(card), 0);

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
  const cardDueAmount = (card: CreditCard) => getCreditCardDueAmount(card);
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .replace(/ /g, "/");
  };

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Credit Cards</h2>
        </div>
        <div className="text-2xl font-bold text-destructive">
          {formatCurrency(totalDue)}
        </div>
      </div>

      <div className="space-y-4 overflow-hidden rounded-none bg-transparent">
        {visibleCards.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">No active credit cards yet. Add one to begin.</div>
        ) : (
          visibleCards.map((card) => (
            <div
              key={card.id}
              ref={(element) => { cardRefs.current[card.id] = element; }}
              className={highlightedId === card.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
            >
              <div
                onClick={() => setSelectedCard(card)}
                className="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-3 transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{card.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{card.provider || card.cardType || "Credit card"}</p>
                  </div>
                  <div className="min-w-[160px] grid gap-2 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Limit</p>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{formatCurrency(card.creditLimit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Available</p>
                      <p className="mt-1 text-sm font-semibold text-sky-400">{formatCurrency(cardAvailable(card))}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">DUE</p>
                    <p className="mt-2 text-sm font-semibold text-destructive">{formatCurrency(cardDueAmount(card))}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Due Date</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{formatDueDate(card.nextDueDate)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Unbilled</p>
                    <p className="mt-2 text-sm font-semibold text-amber-400">{formatCurrency(card.unbilled ?? 0)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={quickAddCardId === card.id ? quickAddAmount : ""}
                        onFocus={(event) => {
                          event.stopPropagation();
                          openQuickAdd(card.id);
                        }}
                        onChange={(event) => {
                          event.stopPropagation();
                          openQuickAdd(card.id);
                          setQuickAddAmount(event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            if (quickAddCardId !== card.id) {
                              openQuickAdd(card.id);
                              return;
                            }
                            confirmQuickAdd();
                          }
                        }}
                        placeholder="Amount"
                        className="min-w-0 w-full rounded-xl border border-white/10 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-right min-w-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">NEXT BILL</span>
                      <span className="text-sm font-semibold text-foreground">{formatDisplayDate(card.nextDueDate, "Not set")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <RecordDetailsDialog
        open={Boolean(selectedCard)}
        title={selectedCard?.name ?? "Card details"}
        description={selectedCard ? `Due Date • ${formatDisplayDate(selectedCard.nextDueDate, "Not set")}` : ""}
        details={
          selectedCard
            ? [
                { label: "Available", value: formatCurrency(cardAvailable(selectedCard)), valueClassName: "text-primary" },
                { label: "Due", value: formatCurrency(cardDueAmount(selectedCard)), valueClassName: "text-destructive" },
              ]
            : []
        }
        plainDetails
        footerActions={
          selectedCard
            ? [
                {
                  key: "history",
                  label: "History",
                  variant: "secondary",
                  onClick: () => setPaymentSheetCardId(selectedCard.id),
                },
                {
                  key: "add-unbilled",
                  label: "Add Unbilled",
                  variant: "secondary",
                  onClick: () => openQuickAdd(selectedCard.id),
                },
                {
                  key: "archive",
                  label: "Archive",
                  variant: "warning",
                  onClick: () => promptArchiveCard(selectedCard),
                },
                {
                  key: "close",
                  label: "Close",
                  variant: "primary",
                  onClick: () => setSelectedCard(null),
                },
              ]
            : [{ key: "close", label: "Close", variant: "primary", onClick: () => setSelectedCard(null) }]
        }
        onClose={() => setSelectedCard(null)}
      />

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
