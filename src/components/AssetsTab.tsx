import { formatCurrency } from "@/lib/utils";
import { useStore, Account, LendItem } from "@/hooks/useStore";
import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";

function AccountRow({ account, onChange }: { account: Account; onChange: (val: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(account.balance.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(account.balance.toString()); }, [account.balance]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const num = Number(val);
    if (!isNaN(num)) onChange(num);
    else setVal(account.balance.toString());
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="font-medium text-sm">{account.name}</span>
      {isEditing ? (
        <div className="flex items-center text-primary">
          <span className="mr-1 text-sm">₹</span>
          <input ref={inputRef} type="number" value={val}
            onChange={(e) => setVal(e.target.value)} onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            className="bg-transparent border-b border-primary w-28 text-right outline-none text-primary font-bold text-sm" />
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="text-primary neon-text font-bold cursor-pointer text-sm">
          {formatCurrency(account.balance)}
        </div>
      )}
    </div>
  );
}

function LendRow({ item, onUpdate, onDelete }: {
  item: LendItem;
  onUpdate: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(item.amount.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(item.amount.toString()); }, [item.amount]);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const num = Number(val);
    if (!isNaN(num)) onUpdate(item.id, num);
    else setVal(item.amount.toString());
  };

  const dateLabel = (() => {
    try { return format(new Date(item.date), "d MMM yyyy"); } catch { return item.date; }
  })();

  return (
    <div className="flex items-center py-3 border-b border-white/5 last:border-0 gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-[10px] text-muted-foreground">{dateLabel}</p>
      </div>
      {isEditing ? (
        <div className="flex items-center text-[#34d399] shrink-0">
          <span className="mr-0.5 text-xs">₹</span>
          <input ref={inputRef} type="number" value={val}
            onChange={(e) => setVal(e.target.value)} onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            className="bg-transparent border-b border-[#34d399] w-24 text-right outline-none text-[#34d399] font-bold text-sm" />
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="text-[#34d399] font-bold cursor-pointer text-sm shrink-0">
          {formatCurrency(item.amount)}
        </div>
      )}
      <button onClick={() => onDelete(item.id)}
        className="text-muted-foreground hover:text-destructive transition-colors text-xs px-1 shrink-0"
        title="Mark returned">
        ✕
      </button>
    </div>
  );
}

interface GroupSectionProps {
  label: string;
  total: number;
  trackOnly?: boolean;
  children: React.ReactNode;
}

function GroupSection({ label, total, trackOnly, children }: GroupSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold tracking-wider uppercase text-xs neon-text">{label}</span>
          {trackOnly && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground uppercase tracking-wide">tracking</span>
          )}
          <span className="text-[#34d399] font-bold text-sm">{formatCurrency(total)}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="glass-card px-4 pb-1 pt-1">{children}</div>}
    </div>
  );
}

export function AssetsTab() {
  const { store, updateStore } = useStore();

  const handleAccountUpdate = (name: string, group: string, newBalance: number) => {
    updateStore((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.name === name && a.group === group ? { ...a, balance: newBalance } : a
      ),
    }));
  };

  const handleLendUpdate = (id: string, amount: number) => {
    updateStore((prev) => ({ ...prev, lends: prev.lends.map((l) => l.id === id ? { ...l, amount } : l) }));
  };

  const handleLendDelete = (id: string) => {
    updateStore((prev) => ({ ...prev, lends: prev.lends.filter((l) => l.id !== id) }));
  };

  // Filter out deleted accounts
  const accounts = store.accounts.filter((a) => a.group === "accounts" && !a.deleted);
  const creditCards = store.accounts.filter((a) => a.group === "credit-cards" && !a.deleted);
  const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
  const ccTotal = creditCards.reduce((sum, a) => sum + a.balance, 0);
  const activeLends = (store.lends ?? []).filter((l) => !l.deleted);
  const lendsTotal = activeLends.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-2">Assets</h2>

      <GroupSection label="Accounts" total={accountsTotal}>
        {accounts.map((acc) => (
          <AccountRow key={acc.name} account={acc}
            onChange={(val) => handleAccountUpdate(acc.name, "accounts", val)} />
        ))}
      </GroupSection>

      <GroupSection label="Credit Cards" total={ccTotal}>
        {creditCards.map((acc) => (
          <AccountRow key={acc.name} account={acc}
            onChange={(val) => handleAccountUpdate(acc.name, "credit-cards", val)} />
        ))}
      </GroupSection>

      <GroupSection label="Lends" total={lendsTotal} trackOnly>
        {activeLends.length === 0 ? (
          <p className="text-muted-foreground text-xs py-3 text-center italic">No lend entries</p>
        ) : (
          activeLends.map((item) => (
            <LendRow key={item.id} item={item} onUpdate={handleLendUpdate} onDelete={handleLendDelete} />
          ))
        )}
      </GroupSection>
    </div>
  );
}
