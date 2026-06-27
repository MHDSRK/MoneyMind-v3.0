import { useLocation } from "wouter";
import { X, Archive, History } from "lucide-react";
import { ExportSection } from "./ExportSection";
import { BackupSection } from "./BackupSection";
import { GoogleDriveSection } from "./GoogleDriveSection";

export function ProfileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090A0F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-14 pb-4 border-b border-white/10">
        <h2 className="text-base font-bold text-foreground tracking-wider">MENU</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-16 space-y-1">
        {/* Archived */}
        <button
          type="button"
          onClick={() => {
            setLocation("/archived");
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
        >
          <Archive className="h-4 w-4 text-primary" />
          Archived
        </button>

        <button
          type="button"
          onClick={() => {
            setLocation("/history");
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
        >
          <History className="h-4 w-4 text-primary" />
          History
        </button>

        <ExportSection />
        <BackupSection />
        <GoogleDriveSection />
      </div>
    </div>
  );
}
