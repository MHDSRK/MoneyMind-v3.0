import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import * as backupService from "@/lib/backupService";
import { formatAppDate } from "@/utils/date";

export function BackupSection() {
  const { store, updateStore } = useStore();
  const [open, setOpen] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    () => backupService.isAutoBackupEnabled()
  );
  const [backups, setBackups] = useState(() => backupService.getBackupsMetadata());
  const [lastAutoBackupTime] = useState(() => backupService.getLastAutoBackupTime());
  const [backupsListOpen, setBackupsListOpen] = useState(false);

  const handleCreateBackup = () => {
    try {
      const metadata = backupService.createBackup(store);
      setBackups(backupService.getBackupsMetadata());
      alert(`Success: Backup created successfully.\n${metadata.size} bytes stored`);
    } catch (err) {
      alert(`Error: Backup failed: ${err}`);
    }
  };

  const handleAutoBackupToggle = (enabled: boolean) => {
    backupService.setAutoBackupEnabled(enabled);
    setAutoBackupEnabled(enabled);
    alert(enabled ? "Success: Auto-backup enabled (daily)" : "Warning: Auto-backup disabled");
  };

  const handleDownloadBackup = (backupId: string, fileName: string) => {
    try {
      backupService.exportBackupAsFile(backupId, fileName);
    } catch (err) {
      alert(`Error: Download failed: ${err}`);
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = backupService.getBackup(backupId);
    if (!backup) {
      alert("Error: Backup not found");
      return;
    }
    if (
      window.confirm(
        "Warning: This will replace all current data with this backup. Are you sure?"
      )
    ) {
      updateStore(() => backup);
      alert("Success: Backup restored successfully.");
    }
  };

  const handleDeleteBackupLocal = (backupId: string) => {
    if (window.confirm("Delete this backup? This cannot be undone.")) {
      backupService.deleteBackup(backupId);
      setBackups(backupService.getBackupsMetadata());
      alert("Success: Backup deleted");
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
          if (
            window.confirm(
              "Warning: This will replace all current data with the uploaded backup. Are you sure?"
            )
          ) {
            updateStore(() => backup);
            alert("Success: Data restored successfully.");
          }
        } catch (err) {
          alert("Error: Invalid backup file");
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <Download className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm uppercase tracking-wider text-foreground">
            Backup &amp; Restore
          </span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="py-2 space-y-0.5 pl-7">
          <div className="py-3 px-3 rounded-xl bg-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Auto-backup (Daily)</span>
              <button
                type="button"
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
                Last backup: {formatAppDate(lastAutoBackupTime)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateBackup}
            className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
          >
            Backup Now
            <Download className="w-3.5 h-3.5 text-primary opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => setBackupsListOpen((o) => !o)}
            className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
          >
            Backups ({backups.length})
            {backupsListOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {backupsListOpen && (
            <div className="ml-3 space-y-1 mt-2 max-h-48 overflow-y-auto">
              {backups.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center italic">
                  No backups yet
                </p>
              ) : (
                backups.map((backup, idx) => (
                  <div key={backup.id} className="bg-black/30 rounded-lg p-2 space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      {idx === 0 ? "Latest" : ""} {backup.fileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatAppDate(backup.timestamp)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleRestoreBackup(backup.id)}
                        className="flex-1 text-[10px] bg-primary/20 border border-primary/30 text-primary px-2 py-1 rounded font-bold hover:bg-primary/30 transition-all"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(backup.id, backup.fileName)}
                        className="flex-1 text-[10px] bg-white/10 border border-white/20 text-muted-foreground px-2 py-1 rounded font-bold hover:bg-white/20 transition-all"
                      >
                        Download
                      </button>
                      <button
                        type="button"
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

          <button
            type="button"
            onClick={handleRestoreFromFile}
            className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
          >
            Import Backup File
            <ChevronRight className="w-3.5 h-3.5 text-primary opacity-60" />
          </button>
        </div>
      )}
    </div>
  );
}
