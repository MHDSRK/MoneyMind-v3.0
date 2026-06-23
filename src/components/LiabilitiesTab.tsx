import { formatCurrency } from "@/lib/utils";
import { useStore, LiabilityItem } from "@/hooks/useStore";
import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";

interface LiabilityRowProps {
  item: LiabilityItem;
  onChange: (val: number) => void;
}

function LiabilityRow({ item, onChange }: LiabilityRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [val, setVal] = useState(item.amount.toString());
  const [nameVal, setNameVal] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  useEffect(() => { setVal(item.amount.toString()); }, [item.amount]);
  useEffect(() => { setNameVal(item.name); }, [item.name]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);
  useEffect(() => { if (isNameEditing && nameInputRef.current) nameInputRef.current.focus(); }, [isNameEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const num = Number(val);
    if (!isNaN(num)) onChange(num);
    else setVal(item.amount.toString());
  };

  const handleNameBlur = () => {
    setIsNameEditing(false);
  };

  const handleAmountClick = () => {
    setIsEditing(true);
    if (val === "0") setVal("");
  };

  const handleLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      setIsNameEditing(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      {isNameEditing ? (
        <input ref={nameInputRef} type="text" value={nameVal}
          onChange={(e) => setNameVal(e.target.value)} onBlur={handleNameBlur}
          onKeyDown={(e) => e.key === "Enter" && handleNameBlur()}
          className="bg-transparent border-b border-primary text-sm outline-none text-foreground font-medium" />
      ) : (
        <span 
          className="font-medium text-sm cursor-pointer select-none hover:text-primary transition-colors"
          onMouseDown={handleLongPress}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPress}
          onTouchEnd={handleLongPressEnd}
        >
          {item.name}
        </span>
      )}
      {isEditing ? (
        <div className="flex items-center text-destructive">
          <span className="mr-1 text-sm">₹</span>
          <input ref={inputRef} type="number" value={val}
            onChange={(e) => setVal(e.target.value)} onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            className="bg-transparent border-b border-destructive w-28 text-right outline-none text-destructive font-bold text-sm" />
        </div>
      ) : (
        <div 
          onClick={handleAmountClick} 
          className="text-destructive font-bold cursor-pointer text-sm hover:opacity-80 transition-opacity"
        >
          {formatCurrency(item.amount)}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  label: string;
  total: number;
  children: React.ReactNode;
  onAddNew?: () => void;
}

function Section({ label, total, children, onAddNew }: SectionProps) {
  const [open, setOpen] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(label);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  useEffect(() => { if (isTitleEditing && titleInputRef.current) titleInputRef.current.focus(); }, [isTitleEditing]);

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
  };

  const handleLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      setIsTitleEditing(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-2"
        onMouseDown={handleLongPress}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPress}
        onTouchEnd={handleLongPressEnd}
      >
        <div className="flex items-center gap-3">
          {isTitleEditing ? (
            <input ref={titleInputRef} type="text" value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)} onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-b border-primary text-xs outline-none font-bold tracking-wider uppercase" />
          ) : (
            <span className="text-primary font-bold tracking-wider uppercase text-xs neon-text">{label}</span>
          )}
          <span className="text-destructive font-bold text-sm">{formatCurrency(total)}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="glass-card overflow-hidden px-4 pb-3 pt-2">
          {children}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs text-primary font-bold hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> ADD NEW
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function LiabilitiesTab() {
  const { store, updateStore } = useStore();

  // Define the order and list of all groups to display
  const GROUPS = ["Regular Expenses", "Chitty", "Borrow", "Others"];

  const handleLiabilityUpdate = (id: string, newAmount: number) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: prev.liabilities.map((l) =>
        l.id === id ? { ...l, amount: newAmount } : l
      ),
    }));
  };

  const handleAddLiability = (group: string) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: [
        ...prev.liabilities,
        {
          id: crypto.randomUUID(),
          group,
          name: "New Item",
          amount: 0,
          dueDate: "",
        },
      ],
    }));
  };

  const visibleLiabilities = store.liabilities.filter((l) => !l.deleted);
  
  // Group liabilities by their group
  const groupedLiabilities = visibleLiabilities.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, LiabilityItem[]>);

  // Calculate totals for each group
  const getGroupTotal = (groupName: string) => {
    return (groupedLiabilities[groupName] || []).reduce((sum, item) => sum + item.amount, 0);
  };

  // Calculate total liabilities
  const totalLiabilities = visibleLiabilities.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground">Others</h2>
        <div className="text-2xl font-bold text-destructive">
          {formatCurrency(totalLiabilities)}
        </div>
      </div>

      {visibleLiabilities.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground italic text-sm">
          No liabilities yet. Click ADD NEW in any group to add items.
        </div>
      ) : null}

      <div className="space-y-3">
        {GROUPS.map((group) => {
          const items = groupedLiabilities[group] || [];
          const groupTotal = getGroupTotal(group);
          
          return (
            <Section 
              key={group}
              label={group} 
              total={groupTotal}
              onAddNew={() => handleAddLiability(group)}
            >
              {items.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">
                  No items yet
                </div>
              ) : (
                items.map((item) => (
                  <LiabilityRow
                    key={item.id}
                    item={item}
                    onChange={(val) => handleLiabilityUpdate(item.id, val)}
                  />
                ))
              )}
            </Section>
          );
        })}
      </div>
    </div>
  );
}
