import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Cloud, ChevronDown, ChevronRight } from "lucide-react";
import * as googleDriveService from "@/lib/googleDriveService";
import { format, parseISO } from "date-fns";

export function GoogleDriveSection() {
  const { store, updateStore } = useStore();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(
    () => googleDriveService.isGoogleDriveConnected()
  );
  const [backups, setBackups] = useState<googleDriveService.GoogleDriveBackup[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    googleDriveService.initiateGoogleAuth();
  };

  const handleDisconnect = () => {
    if (
      window.confirm(
        "⚠️ Disconnect from Google Drive? You'll need to reconnect to sync again."
      )
    ) {
      googleDriveService.disconnectGoogleDrive();
      setConnected(false);
      setBackups([]);
      alert("✓ Disconnected from Google Drive");
    }
  };

  const handleListBackups = async () => {
    if (!connected) {
      alert("❌ Not connected to Google Drive");
      return;
    }
    try {
      setLoading(true);
      const list = await googleDriveService.listGoogleDriveBackups();
      setBackups(list);
    } catch (err) {
      alert(`❌ Failed to list backups: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!connected) {
      alert("❌ Not connected to Google Drive");
      return;
    }
    try {
      setLoading(true);
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
      const fileName = `MoneyMind_Backup_${timestamp}.json`;
      const backup = await googleDriveService.uploadBackupToGoogleDrive(store, fileName);
      alert(`✓ Backup uploaded to Google Drive!\n${backup.name}\n${backup.size} bytes`);
      await handleListBackups();
    } catch (err) {
      alert(`❌ Upload failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setLoading(true);
      const data = await googleDriveService.downloadFromGoogleDrive(fileId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
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
      setLoading(false);
    }
  };

  const handleRestore = async (fileId: string) => {
    if (!window.confirm("⚠️ This will replace all current data. Are you sure?")) return;
    try {
      setLoading(true);
      const data = await googleDriveService.downloadFromGoogleDrive(fileId);
      updateStore(() => data);
      alert("✓ Data restored from Google Drive!");
    } catch (err) {
      alert(`❌ Restore failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (
      !window.confirm("⚠️ Delete this backup from Google Drive permanently?")
    )
      return;
    try {
      setLoading(true);
      await googleDriveService.deleteFromGoogleDrive(fileId);
      alert("✓ Backup deleted");
      await handleListBackups();
    } catch (err) {
      alert(`❌ Delete failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <Cloud className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm uppercase tracking-wider text-foreground">
            Google Drive Sync
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
          {/* Connection status */}
          <div className="py-3 px-3 rounded-xl bg-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Connection Status</span>
              <button
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  connected
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/10 text-muted-foreground hover:bg-white/20"
                } disabled:opacity-50`}
              >
                {loading ? "..." : connected ? "Connected" : "Connect"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {connected
                ? "✓ Connected to Google Drive"
                : "Not connected. Click 'Connect' to enable cloud sync"}
            </p>
          </div>

          {connected && (
            <>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between disabled:opacity-50"
              >
                Upload Now
                <Cloud className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>

              <button
                onClick={handleListBackups}
                disabled={loading}
                className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between disabled:opacity-50"
              >
                View Backups ({backups.length})
                <ChevronRight className="w-3.5 h-3.5 text-primary opacity-60" />
              </button>

              {backups.length > 0 && (
                <div className="mt-2 ml-3 space-y-1 max-h-72 overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="py-2 px-3 rounded-lg bg-black/20 border border-white/5 space-y-1"
                    >
                      <p className="text-xs font-mono text-muted-foreground">
                        {backup.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(backup.modifiedTime), "MMM d, yyyy HH:mm")}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRestore(backup.id)}
                          disabled={loading}
                          className="flex-1 text-center py-1.5 px-2 rounded-lg bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30 transition-all disabled:opacity-50"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDownload(backup.id, backup.name)}
                          disabled={loading}
                          className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white/10 text-muted-foreground text-[10px] font-bold hover:bg-white/20 transition-all disabled:opacity-50"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(backup.id)}
                          disabled={loading}
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
  );
}
