import { formatCurrency } from "@/lib/utils";
import { useStore, Account } from "@/hooks/useStore";
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
          <span className={`font-bold tracking-wider uppercase text-xs ${label === 'Lent' ? 'text-gray-400' : 'text-primary neon-text'}`}>{label}</span>
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

  const handleAccountUpdate = (id: string, newBalance: number) => {
    updateStore((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === id ? { ...a, balance: newBalance } : a
      ),
    }));
  };

  // Filter accounts by type (not group field)
  const bankAccounts = store.accounts.filter((a) => (a.type === "cash" || a.type === "bank") && !a.deleted);
  const businessAccounts = store.accounts.filter((a) => a.type === "business" && !a.deleted);
  const investmentAccounts = store.accounts.filter((a) => a.type === "investments" && !a.deleted);
  const insuranceAccounts = store.accounts.filter((a) => a.type === "insurance" && !a.deleted);
  const otherAccounts = store.accounts.filter((a) => a.type === "other" && !a.deleted);

  const bankTotal = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const businessTotal = businessAccounts.reduce((sum, a) => sum + a.balance, 0);
  const investmentTotal = investmentAccounts.reduce((sum, a) => sum + a.balance, 0);
  const insuranceTotal = insuranceAccounts.reduce((sum, a) => sum + a.balance, 0);
  const otherTotal = otherAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = bankTotal + businessTotal + investmentTotal + insuranceTotal + otherTotal;

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground">Assets</h2>
        <div className={`text-2xl font-bold ${ totalAssets < 0 ? 'text-destructive' : 'text-primary neon-text'}`}>
          {formatCurrency(totalAssets)}
        </div>
      </div>

      <GroupSection label="Bank & Cash" total={bankTotal}>
        {bankAccounts.map((acc) => (
          <AccountRow key={acc.id} account={acc}
            onChange={(val) => handleAccountUpdate(acc.id!, val)} />
        ))}
      </GroupSection>

      <GroupSection label="Business" total={businessTotal}>
        {businessAccounts.map((acc) => (
          <AccountRow key={acc.id} account={acc}
            onChange={(val) => handleAccountUpdate(acc.id!, val)} />
        ))}
      </GroupSection>

      <GroupSection label="Investments" total={investmentTotal}>
        {investmentAccounts.map((acc) => (
          <AccountRow key={acc.id} account={acc}
            onChange={(val) => handleAccountUpdate(acc.id!, val)} />
        ))}
      </GroupSection>

      <GroupSection label="Insurance" total={insuranceTotal}>
        {insuranceAccounts.map((acc) => (
          <AccountRow key={acc.id} account={acc}
            onChange={(val) => handleAccountUpdate(acc.id!, val)} />
        ))}
      </GroupSection>

      <GroupSection label="Lent" total={otherTotal}>
        {otherAccounts.map((acc) => (
          <AccountRow key={acc.id} account={acc}
            onChange={(val) => handleAccountUpdate(acc.id!, val)} />
        ))}
      </GroupSection>
    </div>
  );
}
