import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import * as backupService from "@/lib/backupService";
import * as googleDriveService from "@/lib/googleDriveService";
import {
  X, ChevronDown, ChevronRight, ChevronLeft,
  Download, Pencil, Trash2, Plus, Check, Cloud
} from "lucide-react";
import * as XLSX from "xlsx";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

type GroupScreen =
  | { type: "asset"; groupKey: "accounts" | "credit-cards" | "loans" | "liabilities"; label: string };

// ── Excel export ────────────────────────────────────────────────────────────
function buildAndDownload(
  transactions: ReturnType<typeof useStore>["store"]["transactions"],
  creditCards: ReturnType<typeof useStore>["store"]["creditCards"],
  loans: ReturnType<typeof useStore>["store"]["loans"],
  accounts: ReturnType<typeof useStore>["store"]["accounts"],
  label: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const txRows = transactions.map((tx) => ({
    Date: format(new Date(tx.date), "dd/MM/yyyy"),
    Type: tx.type === "in" ? "Money In" : "Money Out",
    "Ledger / Name": tx.ledger,
    Category: tx.category,
    "From Account": tx.fromAccount || "",
    "To Account": tx.toAccount || "",
    "Amount (₹)": tx.amount,
    Notes: tx.notes || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");

  // Sheet 2: Accounts
  const acctRows = accounts.filter(a => !a.deleted).map((a) => ({
    Name: a.name,
    Type: a.type,
    "Balance (₹)": a.balance,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acctRows), "Accounts");

  // Sheet 3: Credit Cards
  const ccRows = creditCards.filter(c => !c.deleted).map((c) => ({
    Name: c.name,
    Provider: c.provider,
    "Credit Limit (₹)": c.creditLimit,
    "Outstanding (₹)": c.outstanding,
    "Available (₹)": c.creditLimit - c.outstanding,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ccRows), "Credit Cards");

  // Sheet 4: Loans
  const loanRows = loans.filter(l => !l.deleted).map((l) => ({
    Name: l.name,
    Lender: l.lender,
    "Principal (₹)": l.principal,
    "Interest Rate (%)": l.interestRate,
    "EMI (₹)": l.emiAmount,
    "Outstanding (₹)": l.outstanding,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loanRows), "Loans");

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

  // Backup state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => backupService.isAutoBackupEnabled());
  const [backups, setBackups] = useState(() => backupService.getBackupsMetadata());
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState(() => backupService.getLastAutoBackupTime());
  const [backupsListOpen, setBackupsListOpen] = useState(false);

  // Google Drive state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(googleDriveService.isGoogleDriveConnected());
  const [googleDriveOpen, setGoogleDriveOpen] = useState(false);
  const [googleDriveBackups, setGoogleDriveBackups] = useState<googleDriveService.GoogleDriveBackup[]>([]);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);

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
  const [newAccountType, setNewAccountType] = useState<"cash" | "bank" | "business" | "investments" | "insurance" | "other">("bank");
  
  // Credit card add fields
  const [newCreditCardProvider, setNewCreditCardProvider] = useState("");
  const [newCreditCardType, setNewCreditCardType] = useState("");
  const [newCreditCardLimit, setNewCreditCardLimit] = useState("");
  
  // Loan add fields
  const [newLoanLender, setNewLoanLender] = useState("");
  const [newLoanPrincipal, setNewLoanPrincipal] = useState("");
  const [newLoanEMI, setNewLoanEMI] = useState("");
  
  // Liability add fields
  const [newLiabilityAmount, setNewLiabilityAmount] = useState("");

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

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
      setNewAccountType("bank");
      setNewCreditCardProvider("");
      setNewCreditCardType("");
      setNewCreditCardLimit("");
      setNewLoanLender("");
      setNewLoanPrincipal("");
      setNewLoanEMI("");
      setNewLiabilityAmount("");
      setCustomOpen(false);
      setEditingItemId(null);
      setEditFormData(null);
    }
  }, [open]);

  // ── Delete helpers ──────────────────────────────────────────────────────
  const handleDeleteAccount = (id: string) => {
    if (confirmId === `acc-${id}`) {
      updateStore((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === id ? { ...a, deleted: true } : a
        ),
      }));
      setConfirmId(null);
    } else {
      setConfirmId(`acc-${id}`);
    }
  };

  const handleDeleteCreditCard = (id: string) => {
    if (confirmId === `cc-${id}`) {
      updateStore((prev) => ({
        ...prev,
        creditCards: prev.creditCards.map((c) =>
          c.id === id ? { ...c, deleted: true } : c
        ),
      }));
      setConfirmId(null);
    } else {
      setConfirmId(`cc-${id}`);
    }
  };

  const handleDeleteLoan = (id: string) => {
    if (confirmId === `loan-${id}`) {
      updateStore((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === id ? { ...l, deleted: true } : l
        ),
      }));
      setConfirmId(null);
    } else {
      setConfirmId(`loan-${id}`);
    }
  };

  // ── Edit helpers ────────────────────────────────────────────────────────
  const handleStartEdit = (item: any, groupKey: string) => {
    setEditingItemId(`${groupKey}-${item.id}`);
    const itemCopy = JSON.parse(JSON.stringify(item));
    
    // Ensure credit card fields have default values
    if (groupKey === "credit-cards") {
      itemCopy.cardType = itemCopy.cardType || "";
      itemCopy.statementDate = itemCopy.statementDate || 1;
      itemCopy.dueDate = itemCopy.dueDate || 15;
    }
    
    setEditFormData(itemCopy);
  };

  const handleSaveEdit = (groupKey: string) => {
    if (!editFormData) return;
    if (groupKey === "accounts") {
      if (!editFormData.name.trim()) return;
      updateStore((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === editFormData.id ? editFormData : a
        ),
      }));
    } else if (groupKey === "credit-cards") {
      if (!editFormData.name.trim()) return;
      updateStore((prev) => ({
        ...prev,
        creditCards: prev.creditCards.map((c) =>
          c.id === editFormData.id ? editFormData : c
        ),
      }));
    } else if (groupKey === "loans") {
      if (!editFormData.name.trim()) return;
      updateStore((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === editFormData.id ? editFormData : l
        ),
      }));
    }
    setEditingItemId(null);
    setEditFormData(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData(null);
  };

  // ── Add helpers ─────────────────────────────────────────────────────────
  const handleAddAccount = (groupKey: "accounts" | "credit-cards" | "loans" | "liabilities") => {
    if (!newName.trim()) return;
    if (groupKey === "accounts") {
      updateStore((prev) => ({
        ...prev,
        accounts: [
          ...prev.accounts,
          {
            id: crypto.randomUUID(),
            name: newName.trim(),
            type: newAccountType,
            balance: 0,
          },
        ],
      }));
      setNewAccountType("bank");
    } else if (groupKey === "credit-cards") {
      updateStore((prev) => ({
        ...prev,
        creditCards: [
          ...prev.creditCards,
          {
            id: crypto.randomUUID(),
            name: newName.trim(),
            provider: newCreditCardProvider.trim(),
            cardType: newCreditCardType.trim(),
            creditLimit: parseInt(newCreditCardLimit) || 0,
            outstanding: 0,
            unbilled: 0,
            statementDate: 1,
            dueDate: 15,
            nextDueDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setNewCreditCardProvider("");
      setNewCreditCardType("");
      setNewCreditCardLimit("");
    } else if (groupKey === "loans") {
      updateStore((prev) => ({
        ...prev,
        loans: [
          ...prev.loans,
          {
            id: crypto.randomUUID(),
            name: newName.trim(),
            lender: newLoanLender.trim(),
            principal: parseInt(newLoanPrincipal) || 0,
            interestRate: 0,
            emiAmount: parseInt(newLoanEMI) || 0,
            emiCount: 60,
            paidCount: 0,
            emiFrequency: "monthly" as const,
            outstanding: parseInt(newLoanPrincipal) || 0,
            startDate: new Date().toISOString().split("T")[0],
            nextEmiDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setNewLoanLender("");
      setNewLoanPrincipal("");
      setNewLoanEMI("");
    }
    setNewName(""); 
    setIsAdding(false);
    setNewAccountType("bank");
    setNewCreditCardProvider("");
    setNewCreditCardType("");
    setNewCreditCardLimit("");
    setNewLiabilityAmount("");
  };

  // ── Export handler ──────────────────────────────────────────────────────
  const handleExport = (period: string, label: string) => {
    const filtered = filterTx(store.transactions, period, customStart, customEnd);
    buildAndDownload(filtered, store.creditCards, store.loans, store.accounts, label);
  };

  // ── Backup/Restore handlers ──────────────────────────────────────────────
  const handleCreateBackup = () => {
    try {
      const metadata = backupService.createBackup(store);
      setBackups(backupService.getBackupsMetadata());
      alert(`✓ Backup created successfully!\n${metadata.size} bytes stored`);
    } catch (err) {
      alert(`❌ Backup failed: ${err}`);
    }
  };

  const handleAutoBackupToggle = (enabled: boolean) => {
    backupService.setAutoBackupEnabled(enabled);
    setAutoBackupEnabled(enabled);
    alert(enabled ? "✓ Auto-backup enabled (daily)" : "⚠️ Auto-backup disabled");
  };

  const handleDownloadBackup = (backupId: string, fileName: string) => {
    try {
      backupService.exportBackupAsFile(backupId, fileName);
    } catch (err) {
      alert(`❌ Download failed: ${err}`);
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = backupService.getBackup(backupId);
    if (!backup) {
      alert("❌ Backup not found");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ This will replace all current data with this backup. Are you sure?"
    );
    if (confirmed) {
      updateStore(() => backup);
      alert("✓ Backup restored successfully!");
    }
  };

  const handleDeleteBackupLocal = (backupId: string) => {
    const confirmed = window.confirm("Delete this backup? This cannot be undone.");
    if (confirmed) {
      backupService.deleteBackup(backupId);
      setBackups(backupService.getBackupsMetadata());
      alert("✓ Backup deleted");
    }
  };

  const handleRestoreFromFile = () => {
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
            "⚠️ This will replace all current data with the uploaded backup. Are you sure?"
          );
          if (confirmed) {
            updateStore(() => backup);
            alert("✓ Data restored successfully!");
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

  // Google Drive handlers
  const handleGoogleDriveConnect = () => {
    googleDriveService.initiateGoogleAuth();
  };

  const handleGoogleDriveDisconnect = () => {
    if (window.confirm("⚠️ Disconnect from Google Drive? You'll need to reconnect to sync again.")) {
      googleDriveService.disconnectGoogleDrive();
      setGoogleDriveConnected(false);
      setGoogleDriveBackups([]);
      alert("✓ Disconnected from Google Drive");
    }
  };

  const handleUploadToGoogleDrive = async () => {
    if (!googleDriveConnected) {
      alert("❌ Not connected to Google Drive");
      return;
    }
    try {
      setGoogleDriveLoading(true);
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
      const fileName = `MoneyMind_Backup_${timestamp}.json`;
      const backup = await googleDriveService.uploadBackupToGoogleDrive(store, fileName);
      alert(`✓ Backup uploaded to Google Drive!\n${backup.name}\n${backup.size} bytes`);
      await handleListGoogleDriveBackups();
    } catch (err) {
      alert(`❌ Upload failed: ${err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleListGoogleDriveBackups = async () => {
    if (!googleDriveConnected) {
      alert("❌ Not connected to Google Drive");
      return;
    }
    try {
      setGoogleDriveLoading(true);
      const backups = await googleDriveService.listGoogleDriveBackups();
      setGoogleDriveBackups(backups);
      setGoogleDriveOpen(true);
    } catch (err) {
      alert(`❌ Failed to list backups: ${err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleDownloadFromGoogleDrive = async (fileId: string, fileName: string) => {
    try {
      setGoogleDriveLoading(true);
      const data = await googleDriveService.downloadFromGoogleDrive(fileId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      alert("✓ Backup downloaded!");
    } catch (err) {
      alert(`❌ Download failed: ${err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleRestoreFromGoogleDrive = async (fileId: string) => {
    if (!window.confirm("⚠️ This will replace all current data. Are you sure?")) return;
    try {
      setGoogleDriveLoading(true);
      const data = await googleDriveService.downloadFromGoogleDrive(fileId);
      updateStore(() => data);
      alert("✓ Data restored from Google Drive!");
      setGoogleDriveOpen(false);
    } catch (err) {
      alert(`❌ Restore failed: ${err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleDeleteFromGoogleDrive = async (fileId: string) => {
    if (!window.confirm("⚠️ Delete this backup from Google Drive permanently?")) return;
    try {
      setGoogleDriveLoading(true);
      await googleDriveService.deleteFromGoogleDrive(fileId);
      alert("✓ Backup deleted");
      await handleListGoogleDriveBackups();
    } catch (err) {
      alert(`❌ Delete failed: ${err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  if (!open) return null;

  // ── Render: Group Detail Screen ─────────────────────────────────────────
  if (groupScreen) {
    let items: any[] = [];
    let deleteFunc: (id: string) => void = () => {};
    
    if (groupScreen.groupKey === "accounts") {
      items = store.accounts.filter((a) => a.id !== undefined && !a.deleted);
      deleteFunc = handleDeleteAccount;
    } else if (groupScreen.groupKey === "credit-cards") {
      items = store.creditCards.filter((c) => c.id !== undefined && !c.deleted);
      deleteFunc = handleDeleteCreditCard;
    } else if (groupScreen.groupKey === "loans") {
      items = store.loans.filter((l) => l.id !== undefined && !l.deleted);
      deleteFunc = handleDeleteLoan;
    }

    const label = groupScreen.label;
    const isEditing = editingItemId && editingItemId.startsWith(groupScreen.groupKey);

    // ── EDIT FORM ────────────────────────────────────────────────────
    if (isEditing && editFormData) {
      return (
        <div className="fixed inset-0 z-50 bg-[#090A0F] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-safe pt-14 pb-4 border-b border-white/10">
            <button onClick={handleCancelEdit}
              className="p-1 text-muted-foreground hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Edit {editFormData.name}</h2>
          </div>

          {/* Edit Form */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
            {groupScreen.groupKey === "accounts" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit">Credit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Balance (₹)</label>
                  <input
                    type="number"
                    value={editFormData.balance}
                    onChange={(e) => setEditFormData({ ...editFormData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {groupScreen.groupKey === "credit-cards" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Card Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Provider</label>
                  <input
                    type="text"
                    value={editFormData.provider}
                    onChange={(e) => setEditFormData({ ...editFormData, provider: e.target.value })}
                    placeholder="e.g., SBI, HDFC, AXIS"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Card Type</label>
                  <input
                    type="text"
                    value={editFormData.cardType}
                    onChange={(e) => setEditFormData({ ...editFormData, cardType: e.target.value })}
                    placeholder="e.g., OCTANE - VISA SIGNATURE"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={editFormData.creditLimit}
                    onChange={(e) => setEditFormData({ ...editFormData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Statement Date (Day of month)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editFormData.statementDate}
                    onChange={(e) => setEditFormData({ ...editFormData, statementDate: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Due Date (Day of month)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: parseInt(e.target.value) || 15 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {groupScreen.groupKey === "loans" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Loan Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Lender</label>
                  <input
                    type="text"
                    value={editFormData.lender}
                    onChange={(e) => setEditFormData({ ...editFormData, lender: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Principal (₹)</label>
                  <input
                    type="number"
                    value={editFormData.principal}
                    onChange={(e) => setEditFormData({ ...editFormData, principal: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editFormData.interestRate}
                    onChange={(e) => setEditFormData({ ...editFormData, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">EMI Amount (₹)</label>
                  <input
                    type="number"
                    value={editFormData.emiAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, emiAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total EMI Count</label>
                  <input
                    type="number"
                    value={editFormData.emiCount}
                    onChange={(e) => setEditFormData({ ...editFormData, emiCount: parseInt(e.target.value) || 60 })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#090A0F] to-transparent px-4 py-4 flex gap-2 z-50">
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground border border-white/10 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveEdit(groupScreen.groupKey)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    // ── LIST VIEW ────────────────────────────────────────────────────
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
            const idKey = groupScreen.groupKey === "accounts" ? "acc" : groupScreen.groupKey === "credit-cards" ? "cc" : "loan";
            const id = `${idKey}-${item.id}`;
            const isConfirming = confirmId === id;
            return (
              <div key={id}
                className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-[#34d399]">
                    {groupScreen.groupKey === "accounts" && formatCurrency(item.balance)}
                    {groupScreen.groupKey === "credit-cards" && `₹${item.creditLimit} limit`}
                    {groupScreen.groupKey === "loans" && `₹${item.principal} principal`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => handleStartEdit(item, groupScreen.groupKey)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFunc(item.id!)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
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
              </div>
            );
          })}

          {/* Add form */}
          {isAdding ? (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddAccount(groupScreen.groupKey);
                  }
                  if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
                }}
                placeholder="Enter name…"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {groupScreen.groupKey === "accounts" && (
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-foreground"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="business">Business</option>
                  <option value="investments">Investments</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Lent</option>
                </select>
              )}
              {groupScreen.groupKey === "credit-cards" && (
                <>
                  <input
                    type="text"
                    value={newCreditCardProvider}
                    onChange={(e) => setNewCreditCardProvider(e.target.value)}
                    placeholder="Provider (e.g., SBI, HDFC)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={newCreditCardType}
                    onChange={(e) => setNewCreditCardType(e.target.value)}
                    placeholder="Card Type (e.g., VISA SIGNATURE)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={newCreditCardLimit}
                    onChange={(e) => setNewCreditCardLimit(e.target.value)}
                    placeholder="Credit Limit (₹)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </>
              )}
              {groupScreen.groupKey === "loans" && (
                <>
                  <input
                    type="text"
                    value={newLoanLender}
                    onChange={(e) => setNewLoanLender(e.target.value)}
                    placeholder="Lender (e.g., Cred, Bank)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={newLoanPrincipal}
                    onChange={(e) => setNewLoanPrincipal(e.target.value)}
                    placeholder="Principal Amount (₹)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={newLoanEMI}
                    onChange={(e) => setNewLoanEMI(e.target.value)}
                    placeholder="EMI Amount (₹)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </>
              )}
              {groupScreen.groupKey === "liabilities" && (
                <input
                  type="number"
                  value={newLiabilityAmount}
                  onChange={(e) => setNewLiabilityAmount(e.target.value)}
                  placeholder="Amount (₹)"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleAddAccount(groupScreen.groupKey);
                  }}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-bold"
                >
                  Add
                </button>
                <button onClick={() => { 
                  setIsAdding(false); 
                  setNewName(""); 
                  setNewAccountType("bank");
                  setNewCreditCardProvider("");
                  setNewCreditCardType("");
                  setNewCreditCardLimit("");
                  setNewLoanLender("");
                  setNewLoanPrincipal("");
                  setNewLoanEMI("");
                  setNewLiabilityAmount("");
                }}
                  className="text-muted-foreground px-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
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
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Backup & Restore</span>
            </div>
            {backupOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {backupOpen && (
            <div className="py-2 space-y-0.5 pl-7">
              {/* Auto-backup toggle */}
              <div className="py-3 px-3 rounded-xl bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Auto-backup (Daily)</span>
                  <button
                    onClick={() => handleAutoBackupToggle(!autoBackupEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      autoBackupEnabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {autoBackupEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                {lastAutoBackupTime && (
                  <p className="text-xs text-muted-foreground">
                    Last backup: {format(new Date(lastAutoBackupTime), "MMM d, yyyy HH:mm")}
                  </p>
                )}
              </div>

              {/* Manual backup button */}
              <button
                onClick={handleCreateBackup}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
              >
                Backup Now
                <Download className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>

              {/* Backups list toggle */}
              <button
                onClick={() => setBackupsListOpen((o) => !o)}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
              >
                Backups ({backups.length})
                {backupsListOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {/* Backups list */}
              {backupsListOpen && (
                <div className="ml-3 space-y-1 mt-2 max-h-48 overflow-y-auto">
                  {backups.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center italic">No backups yet</p>
                  ) : (
                    backups.map((backup, idx) => (
                      <div key={backup.id} className="bg-black/30 rounded-lg p-2 space-y-1">
                        <p className="text-xs font-medium text-foreground">{idx === 0 ? "Latest" : ""} {backup.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(backup.timestamp), "MMM d, yyyy HH:mm")}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="flex-1 text-[10px] bg-primary/20 border border-primary/30 text-primary px-2 py-1 rounded font-bold hover:bg-primary/30 transition-all"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDownloadBackup(backup.id, backup.fileName)}
                            className="flex-1 text-[10px] bg-white/10 border border-white/20 text-muted-foreground px-2 py-1 rounded font-bold hover:bg-white/20 transition-all"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteBackupLocal(backup.id)}
                            className="flex-1 text-[10px] bg-destructive/20 border border-destructive/30 text-destructive px-2 py-1 rounded font-bold hover:bg-destructive/30 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Import from file */}
              <button
                onClick={handleRestoreFromFile}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
              >
                Import Backup File
                <ChevronRight className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>
            </div>
          )}
        </div>

        {/* ── GOOGLE DRIVE SYNC section ────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setGoogleDriveOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Google Drive Sync</span>
            </div>
            {googleDriveOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {googleDriveOpen && (
            <div className="py-2 space-y-0.5 pl-7">
              {/* Connection status */}
              <div className="py-3 px-3 rounded-xl bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Connection Status</span>
                  <button
                    onClick={googleDriveConnected ? handleGoogleDriveDisconnect : handleGoogleDriveConnect}
                    disabled={googleDriveLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      googleDriveConnected
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-muted-foreground hover:bg-white/20"
                    } disabled:opacity-50`}
                  >
                    {googleDriveLoading ? "..." : googleDriveConnected ? "Connected" : "Connect"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {googleDriveConnected
                    ? "✓ Connected to Google Drive"
                    : "Not connected. Click 'Connect' to enable cloud sync"}
                </p>
              </div>

              {/* Upload to Google Drive */}
              {googleDriveConnected && (
                <>
                  <button
                    onClick={handleUploadToGoogleDrive}
                    disabled={googleDriveLoading}
                    className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between disabled:opacity-50"
                  >
                    Upload Now
                    <Cloud className="w-3.5 h-3.5 text-primary opacity-60" />
                  </button>

                  {/* View Google Drive backups */}
                  <button
                    onClick={handleListGoogleDriveBackups}
                    disabled={googleDriveLoading}
                    className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between disabled:opacity-50"
                  >
                    View Backups ({googleDriveBackups.length})
                    <ChevronRight className="w-3.5 h-3.5 text-primary opacity-60" />
                  </button>

                  {/* Google Drive backups list */}
                  {googleDriveBackups.length > 0 && (
                    <div className="mt-2 ml-3 space-y-1 max-h-72 overflow-y-auto">
                      {googleDriveBackups.map((backup, idx) => (
                        <div key={backup.id} className="py-2 px-3 rounded-lg bg-black/20 border border-white/5 space-y-1">
                          <p className="text-xs font-mono text-muted-foreground">{backup.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(parseISO(backup.modifiedTime), "MMM d, yyyy HH:mm")}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleRestoreFromGoogleDrive(backup.id)}
                              disabled={googleDriveLoading}
                              className="flex-1 text-center py-1.5 px-2 rounded-lg bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30 transition-all disabled:opacity-50"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDownloadFromGoogleDrive(backup.id, backup.name)}
                              disabled={googleDriveLoading}
                              className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white/10 text-muted-foreground text-[10px] font-bold hover:bg-white/20 transition-all disabled:opacity-50"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDeleteFromGoogleDrive(backup.id)}
                              disabled={googleDriveLoading}
                              className="flex-1 text-center py-1.5 px-2 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── EDIT AND ADD section ────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setEditOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <Pencil className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm uppercase tracking-wider text-foreground">Edit & Add</span>
            </div>
            {editOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {editOpen && (
            <div className="py-2 pl-7 space-y-0.5">
              {/* Accounts */}
              <button 
                onClick={() => setGroupScreen({ type: "asset" as const, groupKey: "accounts" as const, label: "Accounts" })}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                Accounts
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Credit Cards */}
              <button 
                onClick={() => setGroupScreen({ type: "asset" as const, groupKey: "credit-cards" as const, label: "Credit Cards" })}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                Credit Cards
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Loans */}
              <button 
                onClick={() => setGroupScreen({ type: "asset" as const, groupKey: "loans" as const, label: "Loans" })}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                Loans
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Liabilities */}
              <button 
                onClick={() => setGroupScreen({ type: "asset" as const, groupKey: "liabilities" as const, label: "Liabilities" })}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between">
                Liabilities
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
