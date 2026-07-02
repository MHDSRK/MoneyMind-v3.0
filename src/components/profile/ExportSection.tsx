import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import { filterTx, buildAndDownload } from "@/lib/exportService";

export function ExportSection() {
  const { store } = useStore();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleExport = (period: string, label: string) => {
    const filtered = filterTx(store.transactions, period, customStart, customEnd);
    buildAndDownload(filtered, store.creditCards, store.loans, store.accounts, label);
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
          <span className="font-bold text-sm uppercase tracking-wider text-foreground">Export</span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
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
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              className="w-full text-left py-3 px-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-between"
            >
              Custom
              {customOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {customOpen && (
              <div className="mt-2 ml-3 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase">From</p>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase">To</p>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!customStart || !customEnd}
                  onClick={() =>
                    handleExport("custom", `Custom_${customStart}_to_${customEnd}`)
                  }
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
  );
}
