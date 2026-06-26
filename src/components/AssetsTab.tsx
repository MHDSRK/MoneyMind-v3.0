import { formatCurrency } from "@/lib/utils";
import { useStore, Account, updateAccount, archiveRecord } from "@/hooks/useStore";
import { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SwipeableListItem } from "@/components/SwipeableListItem";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

function AccountRow({ account, onChange, onNameChange, onArchive }: {
  account: Account;
  onChange: (val: number) => void;
  onNameChange?: (name: string) => void;
  onArchive?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [val, setVal] = useState(account.balance.toString());
  const [nameVal, setNameVal] = useState(account.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();

  useEffect(() => { setVal(account.balance.toString()); }, [account.balance]);
  useEffect(() => { setNameVal(account.name); }, [account.name]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);
  useEffect(() => { if (isNameEditing && nameInputRef.current) nameInputRef.current.focus(); }, [isNameEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const num = Number(val);
    if (!isNaN(num)) onChange(num);
    else setVal(account.balance.toString());
  };

  const handleNameBlur = () => {
    setIsNameEditing(false);
    if (onNameChange && nameVal.trim() !== '') {
      onNameChange(nameVal);
    } else {
      setNameVal(account.name);
    }
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
          {account.name}
        </span>
      )}
      {isEditing ? (
        <div className="flex items-center text-primary">
          <span className="mr-1 text-sm">₹</span>
          <input ref={inputRef} type="number" value={val}
            onChange={(e) => setVal(e.target.value)} onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            className="bg-transparent border-b border-primary w-28 text-right outline-none text-primary font-bold text-sm" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div
            onClick={handleAmountClick}
            className="text-primary neon-text font-bold cursor-pointer text-sm hover:opacity-80 transition-opacity"
          >
            {formatCurrency(account.balance)}
          </div>
        </div>
      )}
    </div>
  );
}

interface GroupSectionProps {
  label: string;
  total: number;
  trackOnly?: boolean;
  children: React.ReactNode;
  onAddNew?: () => void;
  forceOpen?: boolean;
}

function GroupSection({ label, total, trackOnly, children, onAddNew, forceOpen }: GroupSectionProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-2"
      >
        <div className="flex items-center gap-2">
          <span className={`font-bold tracking-wider uppercase text-xs ${label === 'Lent' ? 'text-gray-400' : 'text-primary neon-text'}`}>{label}</span>
          {trackOnly && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground uppercase tracking-wide">tracking</span>
          )}
          <span className="text-[#34d399] font-bold text-sm">{formatCurrency(total)}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="glass-card px-4 pb-3 pt-2">
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

export function AssetsTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);
  const accountRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleAccountUpdate = (id: string, newBalance: number) => {
    updateStore((prev) => updateAccount(prev, id, { balance: newBalance }));
  };

  const handleAccountNameUpdate = (id: string, newName: string) => {
    updateStore((prev) => updateAccount(prev, id, { name: newName }));
  };

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [accountPendingArchive, setAccountPendingArchive] = useState<Account | null>(null);

  const handleArchiveAccount = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      accounts: archiveRecord(prev.accounts, id),
    }));
    toast({ title: "Account archived", description: "The account was archived and removed from active totals." });
  };

  const promptArchiveAccount = (account: Account) => {
    setAccountPendingArchive(account);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveAccount = () => {
    if (!accountPendingArchive) return;
    handleArchiveAccount(accountPendingArchive.id);
    setArchiveDialogOpen(false);
    setAccountPendingArchive(null);
  };

  const cancelArchiveAccount = () => {
    setArchiveDialogOpen(false);
    setAccountPendingArchive(null);
  };

  const handleAddAccount = (type: "cash" | "bank" | "business" | "investments" | "insurance" | "other") => {
    updateStore((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          id: crypto.randomUUID(),
          name: "New Account",
          type,
          balance: 0,
        },
      ],
    }));
  };

  // Filter accounts by type (not group field)
  const bankAccounts = store.accounts.filter(
    (a) => (a.type === "cash" || a.type === "bank") && !a.deleted && !a.archivedAt
  );
  const businessAccounts = store.accounts.filter(
    (a) => a.type === "business" && !a.deleted && !a.archivedAt
  );
  const investmentAccounts = store.accounts.filter(
    (a) => a.type === "investments" && !a.deleted && !a.archivedAt
  );
  const insuranceAccounts = store.accounts.filter(
    (a) => a.type === "insurance" && !a.deleted && !a.archivedAt
  );
  const otherAccounts = store.accounts.filter(
    (a) => a.type === "other" && !a.deleted && !a.archivedAt
  );

  const bankTotal = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const businessTotal = businessAccounts.reduce((sum, a) => sum + a.balance, 0);
  const investmentTotal = investmentAccounts.reduce((sum, a) => sum + a.balance, 0);
  const insuranceTotal = insuranceAccounts.reduce((sum, a) => sum + a.balance, 0);
  const otherTotal = otherAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = bankTotal + businessTotal + investmentTotal + insuranceTotal;

  useEffect(() => {
    if (!location.startsWith("/assets")) {
      return;
    }

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      return;
    }

    const target = store.accounts.find(
      (account) => account.id === focusId && !account.deleted
    );

    if (!target) {
      return;
    }

    if (target.type === "cash" || target.type === "bank") {
      setFocusedGroup("Bank & Cash");
    } else if (target.type === "business") {
      setFocusedGroup("Business");
    } else if (target.type === "investments") {
      setFocusedGroup("Investments");
    } else if (target.type === "insurance") {
      setFocusedGroup("Insurance");
    } else {
      setFocusedGroup("Lent");
    }

    setHighlightedId(focusId);

    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      accountRefs.current[focusId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.accounts]);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground">Assets</h2>
        <div className={`text-2xl font-bold ${ totalAssets < 0 ? 'text-destructive' : 'text-primary neon-text'}`}>
          {formatCurrency(totalAssets)}
        </div>
      </div>

      <GroupSection
        label="Bank & Cash"
        total={bankTotal}
        onAddNew={() => handleAddAccount("bank")}
        forceOpen={focusedGroup === "Bank & Cash"}
      >
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            ref={(element) => {
              accountRefs.current[acc.id] = element;
            }}
            className={highlightedId === acc.id ? "rounded-lg ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
          >
            <AccountRow account={acc}
              onChange={(val) => handleAccountUpdate(acc.id!, val)}
              onNameChange={(name) => handleAccountNameUpdate(acc.id!, name)}
              onArchive={() => handleArchiveAccount(acc.id!)} />
          </div>
        ))}
      </GroupSection>

      <GroupSection
        label="Business"
        total={businessTotal}
        onAddNew={() => handleAddAccount("business")}
        forceOpen={focusedGroup === "Business"}
      >
        {businessAccounts.map((acc) => (
          <div
            key={acc.id}
            ref={(element) => {
              accountRefs.current[acc.id] = element;
            }}
            className={highlightedId === acc.id ? "rounded-lg ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
          >
            <AccountRow account={acc}
              onChange={(val) => handleAccountUpdate(acc.id!, val)}
              onNameChange={(name) => handleAccountNameUpdate(acc.id!, name)}
              onArchive={() => handleArchiveAccount(acc.id!)} />
          </div>
        ))}
      </GroupSection>

      <GroupSection
        label="Investments"
        total={investmentTotal}
        onAddNew={() => handleAddAccount("investments")}
        forceOpen={focusedGroup === "Investments"}
      >
        {investmentAccounts.map((acc) => (
          <div
            key={acc.id}
            ref={(element) => {
              accountRefs.current[acc.id] = element;
            }}
            className={highlightedId === acc.id ? "rounded-lg ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
          >
            <AccountRow account={acc}
              onChange={(val) => handleAccountUpdate(acc.id!, val)}
              onNameChange={(name) => handleAccountNameUpdate(acc.id!, name)}
              onArchive={() => handleArchiveAccount(acc.id!)} />
          </div>
        ))}
      </GroupSection>

      <GroupSection
        label="Insurance"
        total={insuranceTotal}
        onAddNew={() => handleAddAccount("insurance")}
        forceOpen={focusedGroup === "Insurance"}
      >
        {insuranceAccounts.map((acc) => (
          <div
            key={acc.id}
            ref={(element) => {
              accountRefs.current[acc.id] = element;
            }}
            className={highlightedId === acc.id ? "rounded-lg ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
          >
            <AccountRow account={acc}
              onChange={(val) => handleAccountUpdate(acc.id!, val)}
              onNameChange={(name) => handleAccountNameUpdate(acc.id!, name)}
              onArchive={() => handleArchiveAccount(acc.id!)} />
          </div>
        ))}
      </GroupSection>

      <GroupSection
        label="Lent"
        total={otherTotal}
        trackOnly
        onAddNew={() => handleAddAccount("other")}
        forceOpen={focusedGroup === "Lent"}
      >
        {otherAccounts.map((acc) => (
          <div
            key={acc.id}
            ref={(element) => {
              accountRefs.current[acc.id] = element;
            }}
            className={highlightedId === acc.id ? "rounded-lg ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
          >
            <AccountRow account={acc}
              onChange={(val) => handleAccountUpdate(acc.id!, val)}
              onNameChange={(name) => handleAccountNameUpdate(acc.id!, name)}
              onArchive={() => handleArchiveAccount(acc.id!)} />
          </div>
        ))}
      </GroupSection>
    </div>
  );
}
