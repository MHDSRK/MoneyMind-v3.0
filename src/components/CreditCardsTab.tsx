import { useState } from "react";
import { useStore, CreditCard } from "@/hooks/useStore";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function CreditCardsTab() {
  const { store, updateStore } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    cardNumber: "****0000",
    creditLimit: 0,
    statementDate: 1,
    dueDate: 15,
  });

  const handleSave = () => {
    if (!formData.name || !formData.provider || formData.creditLimit <= 0) return;

   const newCard: CreditCard = {
  id: editingId || crypto.randomUUID(),
  name: formData.name,
  provider: formData.provider,
  cardNumber: formData.cardNumber,
  creditLimit: formData.creditLimit,
  outstanding: editingId
    ? (store.creditCards.find((c) => c.id === editingId)?.outstanding ?? 0)
    : 0,
  statementDate: formData.statementDate,
  dueDate: formData.dueDate,
  nextDueDate: editingId
    ? (store.creditCards.find((c) => c.id === editingId)?.nextDueDate ?? "")
    : "",
  createdAt: editingId
    ? (store.creditCards.find((c) => c.id === editingId)?.createdAt || new Date().toISOString())
    : new Date().toISOString(),
};

    updateStore((prev) => {
      if (editingId) {
        return {
          ...prev,
          creditCards: prev.creditCards.map((c) => (c.id === editingId ? newCard : c)),
        };
      }
      return { ...prev, creditCards: [...prev.creditCards, newCard] };
    });

    setFormData({ name: "", provider: "", cardNumber: "****0000", creditLimit: 0, statementDate: 1, dueDate: 15 });
    setEditingId(null);
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      updateStore((prev) => ({
        ...prev,
        creditCards: prev.creditCards.map((c) => (c.id === id ? { ...c, deleted: true } : c)),
      }));
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const visibleCards = store.creditCards.filter((c) => !c.deleted);
  const totalLimit = visibleCards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalOutstanding = visibleCards.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      {/* Summary */}
      <div className="glass-card p-6 flex flex-col items-center text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wider mb-2">TOTAL AVAILABLE</span>
        <h2 className={cn("text-5xl font-bold tracking-tight mb-6",
          (totalLimit - totalOutstanding) >= 0 ? "text-primary neon-text" : "text-destructive")}
        >
          {formatCurrency(totalLimit - totalOutstanding)}
        </h2>
        <div className="flex w-full justify-between px-4">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Credit Limit</span>
            <span className="text-[#34d399] font-medium">{formatCurrency(totalLimit)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs uppercase mb-1">Outstanding</span>
            <span className="text-destructive font-medium">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="flex-1">Card Name</div>
          <div className="w-24 text-right">Limit</div>
          <div className="w-24 text-right">Outstanding</div>
        </div>

        {visibleCards.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic text-sm">
            No credit cards. Tap the + button to add one.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {visibleCards.map((card) => (
              <div key={card.id} className="flex items-center px-4 py-3">
                <div className="flex-1 flex flex-col min-w-0 pr-2">
                  <span className="font-medium text-sm">{card.name}</span>
                  <span className="text-xs text-muted-foreground">{card.provider}</span>
                </div>
                <div className="w-24 text-right text-[#34d399] font-medium text-sm">
                  {formatCurrency(card.creditLimit)}
                </div>
                <div className="w-24 text-right text-destructive font-medium text-sm">
                  {formatCurrency(card.outstanding)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            setEditingId(null);
            setSheetOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#0d1117] border-t border-white/10 rounded-t-2xl p-0"
          style={{ height: "auto", maxHeight: "60vh" }}
        >
          <div className="p-5 space-y-4">
            <h2 className="text-lg font-bold">Add Credit Card</h2>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Card Name"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Provider (HDFC, ICICI, etc.)"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
              placeholder="Credit Limit"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl"
            >
              Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
