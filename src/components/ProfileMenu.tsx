import { useState, useEffect } from "react";
import { useStore, LiabilityItem } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import {
  X, ChevronDown, ChevronRight, ChevronLeft,
  Download, Pencil, Trash2, Plus, Check
} from "lucide-react";
import * as XLSX from "xlsx";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

const LIABILITY_GROUPS = [
  "Credit Cards", "Loan & EMI", "Chitty", "Regular Expenses", "Borrows", "Others",
];

type GroupScreen =
  | { type: "asset"; groupKey: "accounts" | "credit-cards"; label: string }
  | { type: "liability"; group: string };

// ── Excel export ────────────────────────────────────────────────────────────
function buildAndDownload(
  transactions: ReturnType<typeof useStore>["store"]["transactions"],
  liabilities: ReturnType<typeof useStore>["store"]["liabilities"],
  lends: ReturnType<typeof useStore>["store"]["lends"],
  accounts: ReturnType<typeof useStore>["store"]["accounts"],
  label: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const txRows = transactions.map((tx) => ({
    Date: format(new Date(tx.date), "dd/MM/yyyy"),
    Time: format(new Date(tx.date), "HH:mm"),
    Type: tx.type === "in" ? "Money In" : "Money Out",
    "Ledger / Name": tx.ledger,
    Category: tx.category,
    Account: tx.account,
    "Amount (₹)": tx.amount,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");

  // Sheet 2: Accounts
  const acctRows = accounts.map((a) => ({
    Group: a.group === "accounts" ? "Bank/Cash" : "Credit Card",
    Name: a.name,
    "Balance (₹)": a.balance,
    Status: a.deleted ? "Deleted" : "Active",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acctRows), "Accounts");

  // Sheet 3: Liabilities (all, including deleted)
  const liabRows = liabilities.map((l) => ({
    Group: l.group,
    Name: l.name,
    "Amount (₹)": l.amount,
    "Due Date": l.dueDate || "",
    Status: l.deleted ? "Deleted" : "Active",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liabRows), "Liabilities");

  // Sheet 4: Lends (all, including deleted)
  const lendRows = lends.map((l) => ({
    Name: l.name,
    "Amount (₹)": l.amount,
    Date: l.date,
    Status: l.deleted ? "Deleted" : "Active",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lendRows), "Lends");

  XLSX.writeFile(wb, `MoneyMind_${label.replace(/\s+/g, "_")}.xlsx`);
}

function filterTx(
  transactions: ReturnType<typeof useStore>["store"]["transactions"],
  period: string,
  customStart: string,
  customEnd: string
) {
  const now = new Date();
  switch (period) {
    case "today": {
      const s = new Date(); s.setHours(0, 0, 0, 0);
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "this-month": {
      const s = startOfMonth(now);
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "last-6-months": {
      const s = startOfMonth(subMonths(now, 6));
      return transactions.filter((t) => new Date(t.date) >= s);
    }
    case "custom": {
      if (!customStart || !customEnd) return [];
      const s = new Date(customStart + "T00:00:00");
      const e = new Date(customEnd + "T23:59:59");
      return transactions.filter((t) => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    default:
      return transactions;
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export function ProfileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { store, updateStore } = useStore();

  // Section expansion
  const [exportOpen, setExportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  // Group detail screen
  const [groupScreen, setGroupScreen] = useState<GroupScreen | null>(null);

  // Custom date range
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  // Delete confirmation
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Add new item in group
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  // Reset inner state when menu closes
  useEffect(() => {
    if (!open) {
      setGroupScreen(null);
      setExportOpen(false);
      setEditOpen(false);
      setBackupOpen(false);
      setConfirmId(null);
      setIsAdding(false);
      setNewName("");
      setCustomOpen(false);
    }
  }, [open]);

  // ── Delete helpers ──────────────────────────────────────────────────────
  const handleDeleteAccount = (name: string, groupKey: string) => {
    if (confirmId === `acc-${name}`) {
      updateStore((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.name === name && a.group === groupKey ? { ...a, deleted: true } : a
        ),
      }));
      setConfirmId(null);
    } else {
      setConfirmId(`acc-${name}`);
    }
  };

  const handleDeleteLiability = (id: string) => {
    if (confirmId === `liab-${id}`) {
      updateStore((prev) => ({
        ...prev,
        liabilities: prev.liabilities.map((l) =>
          l.id === id ? { ...l, deleted: true } : l
        ),
      }));
      setConfirmId(null);
    } else {
      setConfirmId(`liab-${id}`);
    }
  };

  // ── Add helpers ─────────────────────────────────────────────────────────
  const handleAddAccount = (groupKey: "accounts" | "credit-cards") => {
    if (!newName.trim()) return;
    updateStore((prev) => ({
      ...prev,
     accounts: [
  ...prev.accounts,
  {
    id: crypto.randomUUID(),
    name: newName.trim(),
    type: groupKey === "accounts" ? "other" : "other",
    group: groupKey,
    balance: 0,
  },
],
    }));
    setNewName(""); setIsAdding(false);
  };

  const handleAddLiability = (group: string) => {
    if (!newName.trim()) return;
    const item: LiabilityItem = {
      id: crypto.randomUUID(), group, name: newName.trim(), amount: 0, dueDate: "",
    };
    updateStore((prev) => ({ ...prev, liabilities: [...prev.liabilities, item] }));
    setNewName(""); setIsAdding(false);
  };

  // ── Export handler ──────────────────────────────────────────────────────
  const handleExport = (period: string, label: string) => {
    const filtered = filterTx(store.transactions, period, customStart, customEnd);
    buildAndDownload(filtered, store.liabilities, store.lends, store.accounts, label);
  };

  // ── Backup/Restore handlers ──────────────────────────────────────────────
  const handleBackup = () => {
    const backup = JSON.stringify(store, null, 2);
    const blob = new Blob([backup], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MoneyMind_Backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string);
          const confirmed = window.confirm(
            "⚠️ This will replace all current data with the backup. Are you sure?"
          );
          if (confirmed) {
            updateStore(() => backup);
            alert("✓ Backup restored successfully!");
          }
        } catch (err) {
          alert("❌ Invalid backup file");
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!open) return null;

  // ── Render: Group Detail Screen ─────────────────────────────────────────
  if (groupScreen) {
    const items =
      groupScreen.type === "asset"
        ? store.accounts.filter((a) => a.group === groupScreen.groupKey && !a.deleted)
        : store.liabilities.filter((l) => l.group === groupScreen.group && !l.deleted);

    const label =
      groupScreen.type === "asset" ? groupScreen.label : groupScreen.group;

    return (
      <div className="fixed inset-0 z-50 bg-[#090A0F] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-safe pt-14 pb-4 border-b border-white/10">
          <button onClick={() => { setGroupScreen(null); setConfirmId(null); setIsAdding(false); setNewName(""); }}
            className="p-1 text-muted-foreground hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">{label}</h2>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-32">
          {items.length === 0 && !isAdding && (
            <p className="text-muted-foreground italic text-sm text-center py-8">No items</p>
          )}
          {items.map((item) => {
            const id = groupScreen.type === "asset"
              ? `acc-${(item as typeof store.accounts[0]).name}`
              : `liab-${(item as LiabilityItem).id}`;
            const isConfirming = confirmId === id;
            return (
              <div key={id}
                className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{(item as { name: string }).name}</p>
                  {groupScreen.type === "asset" && (
                    <p className="text-xs text-[#34d399]">{formatCurrency((item as typeof store.accounts[0]).balance)}</p>
                  )}
                  {groupScreen.type === "liability" && (
                    <p className="text-xs text-destructive">{formatCurrency((item as LiabilityItem).amount)}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (groupScreen.type === "asset") {
                      handleDeleteAccount(
                        (item as typeof store.accounts[0]).name,
                        groupScreen.groupKey
                      );
                    } else {
                      handleDeleteLiability((item as LiabilityItem).id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ml-3 ${
                    isConfirming
                      ? "bg-destructive text-white animate-pulse"
                      : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  }`}
                >
                  {isConfirming ? (
                    <><Check className="w-3.5 h-3.5" /> Confirm</>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}

          {/* Add form */}
          {isAdding ? (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (groupScreen.type === "asset") handleAddAccount(groupScreen.groupKey);
                    else handleAddLiability(groupScreen.group);
                  }
                  if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
                }}
                placeholder="Enter name…"
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  if (groupScreen.type === "asset") handleAddAccount(groupScreen.groupKey);
                  else handleAddLiability(groupScreen.group);
                }}
                className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-bold"
              >
                Add
              </button>
              <button onClick={() => { setIsAdding(false); setNewName(""); }}
                className="text-muted-foreground px-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 mt-5 text-primary font-bold text-sm uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}

          {/* Delete notice */}
          {confirmId && (
            <p className="mt-4 text-[11px] text-muted-foreground text-center">
              Tap the red button again to confirm permanent removal. Data is kept in exports.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Main Menu ───────────────────────────────────────────────────
  const allLiabilityGroups = [
    ...LIABILITY_GROUPS,
    ...Array.from(new Set(store.liabilities.map((l) => l.group))).filter(
      (g) => !LIABILITY_GROUPS.includes(g)
    ),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#090A0F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-14 pb-4 border-b border-white/10">
        <h2 className="text-base font-bold text-foreground tracking-wider">MENU</h2>
        <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-16 space-y-1">

        {/* ── EXPORT section ──────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setExportOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Export</span>
            </div>
            {exportOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {exportOpen && (
            <div className="py-2 space-y-0.5 pl-7">
              {[
                { label: "Today", period: "today" },
                { label: "This Month", period: "this-month" },
                { label: "Last 6 Months", period: "last-6-months" },
                { label: "All Time", period: "all-time" },
              ].map(({ label, period }) => (
                <button
                  key={period}
                  onClick={() => handleExport(period, label)}
                  className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  {label}
                  <Download className="w-3.5 h-3.5 text-primary opacity-60" />
                </button>
              ))}

              {/* Custom range */}
              <div>
                <button
                  onClick={() => setCustomOpen((o) => !o)}
                  className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  Custom
                  {customOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {customOpen && (
                  <div className="mt-2 ml-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase">From</p>
                        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase">To</p>
                        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
                      </div>
                    </div>
                    <button
                      disabled={!customStart || !customEnd}
                      onClick={() => handleExport("custom", `Custom_${customStart}_to_${customEnd}`)}
                      className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-30 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── BACKUP section ──────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setBackupOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Backup</span>
            </div>
            {backupOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {backupOpen && (
            <div className="py-2 space-y-0.5 pl-7">
              <button
                onClick={handleBackup}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
              >
                Export Backup
                <Download className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>
              <button
                onClick={handleRestore}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
              >
                Import Backup
                <ChevronRight className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>
            </div>
          )}
        </div>

        {/* ── EDIT section ────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setEditOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Pencil className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Edit</span>
            </div>
            {editOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {editOpen && (
            <div className="py-2 pl-7 space-y-0.5">
              {/* Assets sub-header */}
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold pt-2 pb-1 px-3 neon-text">Assets</p>
              {[
                { label: "Accounts", screen: { type: "asset" as const, groupKey: "accounts" as const, label: "Accounts" } },
                { label: "Credit Cards", screen: { type: "asset" as const, groupKey: "credit-cards" as const, label: "Credit Cards" } },
              ].map(({ label, screen }) => (
                <button key={label} onClick={() => setGroupScreen(screen)}
                  className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                  {label}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              {/* Liabilities sub-header */}
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold pt-4 pb-1 px-3 neon-text">Liabilities</p>
              {allLiabilityGroups.map((group) => (
                <button key={group} onClick={() => setGroupScreen({ type: "liability", group })}
                  className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                  {group}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
