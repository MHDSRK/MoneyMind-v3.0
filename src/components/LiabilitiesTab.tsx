import { formatCurrency } from "@/lib/utils";
import { useStore, LiabilityItem, updateLiability, archiveRecord, restoreRecord } from "@/hooks/useStore";
import { calculateMetrics } from "@/lib/calculations";
import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LiabilityRowProps {
  item: LiabilityItem;
  onChange: (val: number) => void;
  onNameChange: (name: string) => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete?: () => void;
}

function LiabilityRow({ item, onChange, onNameChange, onArchive, onRestore, onDelete }: LiabilityRowProps) {
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
    onNameChange(nameVal.trim() || item.name);
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
        <div className="flex items-center gap-2">
          <div
            onClick={handleAmountClick}
            className="text-destructive font-bold cursor-pointer text-sm hover:opacity-80 transition-opacity"
          >
            {formatCurrency(item.amount)}
          </div>
          {item.archivedAt ? (
            <button
              type="button"
              onClick={onRestore}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary/40 text-primary hover:bg-primary/15 transition-colors"
            >
              Restore
            </button>
          ) : (
            <button
              onClick={onArchive}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary/40 text-primary hover:bg-primary/15 transition-colors"
            >
              Archive
            </button>
          )}
          {item.archivedAt && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-destructive/40 text-destructive hover:bg-destructive/15 transition-colors"
            >
              Delete
            </button>
          )}
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
  forceOpen?: boolean;
}

function Section({ label, total, children, onAddNew, forceOpen }: SectionProps) {
  const [open, setOpen] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(label);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  useEffect(() => { if (isTitleEditing && titleInputRef.current) titleInputRef.current.focus(); }, [isTitleEditing]);
  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

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
  const [location] = useLocation();
  const [showArchived, setShowArchived] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);
  const liabilityRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Define the order and list of all groups to display
  const GROUPS = ["Regular Expenses", "Chitty", "Borrow", "More Liabilities"];

  const handleLiabilityUpdate = (id: string, newAmount: number) => {
    updateStore((prev) => updateLiability(prev, id, { amount: newAmount }));
  };

  const handleLiabilityNameUpdate = (id: string, newName: string) => {
    if (!newName || newName === store.liabilities.find((l) => l.id === id)?.name) return;

    updateStore((prev) => updateLiability(prev, id, { name: newName }));

    toast({ title: "Liability updated", description: `${newName} was saved.` });
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleArchiveLiability = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: archiveRecord(prev.liabilities, id),
    }));
    toast({ title: "Liability archived", description: "The liability was archived and removed from active totals." });
  };

  const handleHardDeleteLiability = (id: string) => {
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) {
      return;
    }

    updateStore((prev) => updateLiability(prev, id, { deleted: true }));
    toast({ title: "Liability deleted", description: "The record was permanently deleted." });
  };

  const handleRestoreLiability = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: restoreRecord(prev.liabilities, id),
    }));
    toast({ title: "Liability restored", description: "The liability is active again." });
  };

  const visibleLiabilities = store.liabilities.filter(
    (liability) =>
      !liability.deleted &&
      (showArchived ? Boolean(liability.archivedAt) : !liability.archivedAt)
  );
  
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

  const metrics = calculateMetrics(store);
  const totalLiabilities = metrics.totalLiabilities;

  useEffect(() => {
    if (!location.startsWith("/others")) {
      return;
    }

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      return;
    }

    const target = store.liabilities.find((liability) => liability.id === focusId && !liability.deleted);
    if (!target) {
      return;
    }

    const shouldShowArchived = Boolean(target.archivedAt);
    if (showArchived !== shouldShowArchived) {
      setShowArchived(shouldShowArchived);
    }

    setFocusedGroup(target.group);
    setHighlightedId(focusId);

    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      liabilityRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, showArchived, store.liabilities]);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground">More</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalLiabilities)}
          </div>
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className="text-xs text-primary underline"
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
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
              forceOpen={focusedGroup === group}
            >
              {items.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">
                  No items yet
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    ref={(element) => {
                      liabilityRefs.current[item.id] = element;
                    }}
                    className={highlightedId === item.id ? "rounded-lg ring-2 ring-primary/60" : ""}
                  >
                    <LiabilityRow
                      item={item}
                      onChange={(val) => handleLiabilityUpdate(item.id, val)}
                      onNameChange={(name) => handleLiabilityNameUpdate(item.id, name)}
                      onArchive={() => handleArchiveLiability(item.id)}
                      onRestore={() => handleRestoreLiability(item.id)}
                      onDelete={showArchived ? () => handleHardDeleteLiability(item.id) : undefined}
                    />
                  </div>
                ))
              )}
            </Section>
          );
        })}
      </div>
    </div>
  );
}
