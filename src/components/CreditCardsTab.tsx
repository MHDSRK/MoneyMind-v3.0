import { useState, useRef, useEffect } from "react";
import { useStore, CreditCard, updateCreditCard, archiveRecord } from "@/hooks/useStore";
import { formatCurrency, cn } from "@/lib/utils";
import { calculateMetrics } from "@/lib/calculations";
import { ChevronUp, ChevronDown, Plus, Pencil, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";

export function CreditCardsTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editProvider, setEditProvider] = useState("");
  const [editCardType, setEditCardType] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editOutstanding, setEditOutstanding] = useState("");
  const [editUnbilled, setEditUnbilled] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [paymentSheetCardId, setPaymentSheetCardId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!location.startsWith("/cards")) {
      return;
    }

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      return;
    }

    const target = store.creditCards.find((card) => card.id === focusId && !card.deleted);
    if (!target) {
      return;
    }

    setExpandedCardId(focusId);
    setEditingCardId(null);
    setHighlightedId(focusId);

    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      cardRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.creditCards]);

  const handleUnbilledUpdate = (cardId: string, newUnbilled: number) => {
    updateStore((prev) => updateCreditCard(prev, cardId, { unbilled: Math.max(0, newUnbilled) }));
  };

  const handleAddCard = () => {
    updateStore((prev) => ({
      ...prev,
      creditCards: [
        ...prev.creditCards,
        {
          id: crypto.randomUUID(),
          name: "New Card",
          provider: "",
          cardType: "",
          creditLimit: 0,
          outstanding: 0,
          unbilled: 0,
          statementDate: 1,
          dueDate: 15,
          nextDueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
    toast({ title: "Card added", description: "Your card was added successfully." });
  };

  const handleEditStart = (card: CreditCard) => {
    setEditingCardId(card.id);
    setEditName(card.name);
    setEditProvider(card.provider);
    setEditCardType(card.cardType || "");
    setEditLimit(card.creditLimit.toString());
    setEditOutstanding(card.outstanding.toString());
    setEditUnbilled((card.unbilled ?? 0).toString());
    setEditDueDate(card.dueDate.toString());
    setEditNextDueDate(card.nextDueDate ? new Date(card.nextDueDate).toISOString().split('T')[0] : "");
  };

  const handleEditSave = (cardId: string) => {
    updateStore((prev) => updateCreditCard(prev, cardId, {
      name: editName,
      provider: editProvider,
      cardType: editCardType,
      creditLimit: parseInt(editLimit) || 0,
      outstanding: parseInt(editOutstanding) || 0,
      unbilled: parseInt(editUnbilled) || 0,
      dueDate: parseInt(editDueDate) || 15,
      nextDueDate: editNextDueDate ? new Date(editNextDueDate).toISOString() : undefined,
    }));
    setEditingCardId(null);
    toast({ title: "Card updated", description: "The card details were saved." });
  };

  const handleArchiveCard = (cardId: string) => {
    updateStore((prev) => ({
      ...prev,
      creditCards: archiveRecord(prev.creditCards, cardId),
    }));
    toast({ title: "Card archived", description: "The card was archived and removed from active totals." });
  };

  const handleHardDeleteCard = (cardId: string) => {
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) {
      return;
    }

    updateStore((prev) => updateCreditCard(prev, cardId, { deleted: true }));
    toast({ title: "Card deleted", description: "The record was permanently deleted." });
  };

  const visibleCards = store.creditCards.filter(
    (card) => !card.deleted && !card.archivedAt
  );
  const metrics = calculateMetrics(store);
  const totalLimit = metrics.creditCardTotalLimit;
  const totalOutstanding = metrics.creditCardOutstanding;
  const totalUnbilled = metrics.creditCardUnbilled;

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
          No credit cards yet. Click the ADD NEW button below to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            const isEditing = editingCardId === card.id;
            const available = card.creditLimit - card.outstanding - (card.unbilled ?? 0);

            return (
              <div
                key={card.id}
                ref={(element) => {
                  cardRefs.current[card.id] = element;
                }}
                className={cn("glass-card overflow-hidden", highlightedId === card.id && "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]")}
              >
                {/* Card Header */}
                <div className="w-full text-left p-4 flex items-start justify-between hover:bg-white/5 transition-colors">
                  {/* Edit mode: show editable fields */}
                  {isEditing && (
                    <div className="flex-1 space-y-2 mr-3">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Card Name"
                        className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm text-foreground outline-none font-bold"
                      />
                      <input 
                        type="text" 
                        value={editProvider}
                        onChange={(e) => setEditProvider(e.target.value)}
                        placeholder="Provider"
                        className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                      />
                      <input 
                        type="text" 
                        value={editCardType}
                        onChange={(e) => setEditCardType(e.target.value)}
                        placeholder="Card Type (e.g., VISA SIGNATURE)"
                        className="w-full bg-black/20 border border-primary/50 rounded px-2 py-1 text-xs text-foreground outline-none"
                      />
                    </div>
                  )}

                  {/* Display mode: show card info */}
                  {!isEditing && (
                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      className="flex-1 text-left"
                    >
                      <p className="font-bold text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.provider && card.cardType ? `${card.provider} - ${card.cardType}` : (card.cardType || card.provider || "No type set")}
                      </p>
                    </button>
                  )}

                  <div className="flex items-start gap-2 ml-3 shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => handleEditSave(card.id)}
                        className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold hover:opacity-90"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditStart(card)}
                        className="p-1 hover:bg-primary/20 rounded transition-colors"
                        title="Edit card details"
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </button>
                    )}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Limit / Available</p>
                        <p className={cn(
                          "font-bold text-sm",
                          (card.creditLimit - card.outstanding - (card.unbilled ?? 0)) < 0 ? "text-destructive" : ""
                        )}>
                          {formatCurrency(card.creditLimit)} / {formatCurrency(Math.max(0, card.creditLimit - card.outstanding - (card.unbilled ?? 0)))}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="p-0 hover:opacity-70 transition-opacity"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Details - Expandable */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        {/* Credit Limit */}
                        <div>
                          <label className="text-xs text-muted-foreground">Credit Limit</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">₹</span>
                            <input
                              type="number"
                              value={editLimit}
                              onChange={(e) => setEditLimit(e.target.value)}
                              className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                            />
                          </div>
                        </div>

                        {/* Available Amount */}
                        <div>
                          <label className="text-xs text-muted-foreground">Available Amount</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">₹</span>
                            <input
                              type="number"
                              value={Math.max(0, parseInt(editLimit) - parseInt(editOutstanding) - parseInt(editUnbilled)).toString()}
                              readOnly
                              className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none opacity-60"
                            />
                          </div>
                        </div>

                        {/* Due Amount */}
                        <div>
                          <label className="text-xs text-muted-foreground">Due Amount</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">₹</span>
                            <input
                              type="number"
                              value={editOutstanding}
                              onChange={(e) => setEditOutstanding(e.target.value)}
                              className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                            />
                          </div>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="text-xs text-muted-foreground">Due Date (Day of Month)</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none mt-1"
                          />
                        </div>

                        {/* Unbilled */}
                        <div>
                          <label className="text-xs text-muted-foreground">Unbilled</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">₹</span>
                            <input
                              type="number"
                              value={editUnbilled}
                              onChange={(e) => setEditUnbilled(e.target.value)}
                              className="flex-1 bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none"
                            />
                          </div>
                        </div>

                        {/* Next Bill Date */}
                        <div>
                          <label className="text-xs text-muted-foreground">Next Bill Date</label>
                          <input
                            type="date"
                            value={editNextDueDate}
                            onChange={(e) => setEditNextDueDate(e.target.value)}
                            className="w-full bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
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
                            <span className="text-xs text-muted-foreground">Unbilled</span>
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

                        <div className="border-t border-white/10 pt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentSheetCardId(card.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-white/20 text-muted-foreground hover:bg-white/10 transition-colors"
                          >
                            <History className="w-3 h-3" /> History
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveCard(card.id)}
                            className="px-2 py-1 rounded text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/15 transition-colors"
                          >
                            Archive
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Button */}
      <button
        onClick={handleAddCard}
        className="w-full py-3 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 rounded-xl text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> ADD NEW CARD
      </button>

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
