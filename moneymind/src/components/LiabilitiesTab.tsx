import { formatCurrency } from "@/lib/utils";
import { useStore, LiabilityItem } from "@/hooks/useStore";
import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Calendar, Check } from "lucide-react";
import { format, parseISO, addMonths } from "date-fns";

const LIABILITY_GROUPS = [
  "Credit Cards", "Loan & EMI", "Chitty", "Regular Expenses", "Borrows", "Others",
];

const SWIPE_THRESHOLD = 64;
const SNAP_LEFT = -104;
const SNAP_RIGHT = 164;

function LiabilityRow({
  item, onUpdate,
}: {
  item: LiabilityItem;
  onUpdate: (id: string, field: keyof LiabilityItem, val: string | number) => void;
}) {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amtVal, setAmtVal] = useState(item.amount.toString());
  const amtRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [partialVal, setPartialVal] = useState("");
  const partialRef = useRef<HTMLInputElement>(null);

  const [swipeX, setSwipeX] = useState(0);
  const [snapped, setSnapped] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const liveX = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  useEffect(() => { setAmtVal(item.amount.toString()); }, [item.amount]);
  useEffect(() => { if (isEditingAmount && amtRef.current) amtRef.current.focus(); }, [isEditingAmount]);
  useEffect(() => { if (snapped === "right" && partialRef.current) partialRef.current.focus(); }, [snapped]);

  const snapTo = (target: number, side: "left" | "right" | null) => {
    setAnimating(true); setSwipeX(target); setSnapped(side);
    setTimeout(() => setAnimating(false), 200);
  };
  const snapBack = () => {
    setAnimating(true); setSwipeX(0); setSnapped(null); setPartialVal("");
    setTimeout(() => setAnimating(false), 200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditingAmount) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    liveX.current = swipeX;
    isHorizontal.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - (touchStartY.current ?? 0);
    if (isHorizontal.current === null && Math.abs(dx) + Math.abs(dy) > 8)
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    if (!isHorizontal.current) return;
    e.preventDefault();
    const base = snapped === "left" ? SNAP_LEFT : snapped === "right" ? SNAP_RIGHT : 0;
    const clamped = Math.max(SNAP_LEFT - 8, Math.min(SNAP_RIGHT + 8, base + dx));
    liveX.current = clamped; setSwipeX(clamped);
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || !isHorizontal.current) { touchStartX.current = null; return; }
    touchStartX.current = null;
    const base = snapped === "left" ? SNAP_LEFT : snapped === "right" ? SNAP_RIGHT : 0;
    const delta = liveX.current - base;
    if (snapped === "left") { delta > SWIPE_THRESHOLD ? snapBack() : snapTo(SNAP_LEFT, "left"); }
    else if (snapped === "right") { delta < -SWIPE_THRESHOLD ? snapBack() : snapTo(SNAP_RIGHT, "right"); }
    else {
      if (liveX.current < -SWIPE_THRESHOLD) snapTo(SNAP_LEFT, "left");
      else if (liveX.current > SWIPE_THRESHOLD) snapTo(SNAP_RIGHT, "right");
      else snapBack();
    }
  };

  const handlePaidFully = () => {
    onUpdate(item.id, "amount", 0);
    if (item.dueDate) {
      try { onUpdate(item.id, "dueDate", format(addMonths(parseISO(item.dueDate), 1), "yyyy-MM-dd")); }
      catch { /* ignore */ }
    }
    snapBack();
  };
  const handlePartialSave = () => {
    const paid = Number(partialVal);
    if (!isNaN(paid) && paid > 0) onUpdate(item.id, "amount", Math.max(0, item.amount - paid));
    snapBack();
  };
  const handleAmountBlur = () => {
    setIsEditingAmount(false);
    const num = Number(amtVal);
    if (!isNaN(num)) onUpdate(item.id, "amount", num);
    else setAmtVal(item.amount.toString());
  };

  const formattedDate = item.dueDate
    ? (() => { try { return format(parseISO(item.dueDate), "d MMM yyyy"); } catch { return item.dueDate; } })()
    : null;

  return (
    <div className="relative overflow-hidden border-b border-white/5 last:border-0">
      <div className="absolute inset-y-0 left-0 flex items-center bg-blue-600" style={{ width: SNAP_RIGHT }}>
        <div className="flex items-center gap-1 px-3 w-full">
          <span className="text-white text-[10px] font-bold whitespace-nowrap mr-1">Partial:</span>
          <span className="text-white text-xs">₹</span>
          <input ref={partialRef} type="number" value={partialVal}
            onChange={(e) => setPartialVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePartialSave()}
            placeholder="0"
            className="flex-1 bg-white/20 rounded px-2 py-1 text-white text-xs outline-none w-0 min-w-0 placeholder:text-white/50" />
          <button onClick={handlePartialSave} className="ml-1 bg-white/20 rounded-full p-1 shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-[#34d399]"
        style={{ width: Math.abs(SNAP_LEFT) }}>
        <button onClick={handlePaidFully} className="flex flex-col items-center gap-0.5 px-2">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
          <span className="text-white text-[10px] font-bold">PAID</span>
        </button>
      </div>

      <div
        className="relative flex items-center py-3 gap-2 select-none"
        style={{
          backgroundColor: "#0d1117",
          transform: `translateX(${swipeX}px)`,
          transition: animating ? "transform 0.2s ease" : "none",
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span className="flex-1 font-medium text-sm truncate">{item.name}</span>

        {isEditingAmount ? (
          <div className="flex items-center text-destructive shrink-0">
            <span className="mr-0.5 text-xs">₹</span>
            <input ref={amtRef} type="number" value={amtVal}
              onChange={(e) => setAmtVal(e.target.value)}
              onBlur={handleAmountBlur}
              onKeyDown={(e) => e.key === "Enter" && handleAmountBlur()}
              className="bg-transparent border-b border-destructive w-24 text-right outline-none text-destructive font-bold text-sm" />
          </div>
        ) : (
          <div onClick={() => { if (snapped) { snapBack(); return; } setIsEditingAmount(true); }}
            className="text-destructive font-bold cursor-pointer text-sm shrink-0">
            {formatCurrency(item.amount)}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {formattedDate && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Due: <span className="text-primary">{formattedDate}</span>
            </span>
          )}
          <button onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.click()}
            className="text-muted-foreground hover:text-primary transition-colors" title="Set due date">
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <input ref={dateRef} type="date" value={item.dueDate}
            onChange={(e) => onUpdate(item.id, "dueDate", e.target.value)}
            className="sr-only" tabIndex={-1} />
        </div>
      </div>
    </div>
  );
}

function GroupSection({ group, items, total, onUpdate }: {
  group: string;
  items: LiabilityItem[];
  total: number;
  onUpdate: (id: string, field: keyof LiabilityItem, val: string | number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold tracking-wider uppercase text-xs neon-text">{group}</span>
          <span className="text-destructive font-bold text-sm">{formatCurrency(total)}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="glass-card overflow-hidden px-4 pb-2 pt-1">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-xs py-3 text-center italic">No items</p>
          ) : (
            items.map((item) => <LiabilityRow key={item.id} item={item} onUpdate={onUpdate} />)
          )}
        </div>
      )}
    </div>
  );
}

export function LiabilitiesTab() {
  const { store, updateStore } = useStore();

  const handleUpdate = (id: string, field: keyof LiabilityItem, val: string | number) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: prev.liabilities.map((l) => l.id === id ? { ...l, [field]: val } : l),
    }));
  };

  const allGroups = [
    ...LIABILITY_GROUPS,
    ...Array.from(new Set(store.liabilities.map((l) => l.group))).filter(
      (g) => !LIABILITY_GROUPS.includes(g)
    ),
  ];

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-2">Liabilities</h2>

      {allGroups.map((group) => {
        // Filter out deleted items for display
        const items = store.liabilities.filter((l) => l.group === group && !l.deleted);
        const total = items.reduce((sum, l) => sum + l.amount, 0);
        return (
          <GroupSection key={group} group={group} items={items} total={total} onUpdate={handleUpdate} />
        );
      })}
    </div>
  );
}
