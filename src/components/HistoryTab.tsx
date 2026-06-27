import { useMemo } from "react";
import { useStore, HistoryEvent } from "@/hooks/useStore";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Activity, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<string, { label: string; accent: string }> = {
  create: { label: "Created", accent: "text-emerald-400" },
  edit: { label: "Edited", accent: "text-sky-400" },
  archive: { label: "Archived", accent: "text-orange-400" },
  restore: { label: "Restored", accent: "text-lime-400" },
  delete: { label: "Deleted", accent: "text-destructive" },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  create: <Activity className="h-4 w-4" />,
  edit: <Activity className="h-4 w-4" />,
  archive: <Activity className="h-4 w-4" />,
  restore: <Activity className="h-4 w-4" />,
  delete: <Activity className="h-4 w-4" />,
};

function getEventLabel(event: HistoryEvent) {
  return EVENT_LABELS[event.type] || { label: "Updated", accent: "text-muted-foreground" };
}

export default function HistoryTab() {
  const { store } = useStore();

  const recentHistory = useMemo(
    () =>
      store.history
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20),
    [store.history]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-5">
      <div>
        <h1 className="text-xl font-bold text-white">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent activity from the last few days, including creates, edits, archives, restores, and deletes.
        </p>
      </div>

      {recentHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center">
          <Clock3 className="mx-auto h-9 w-9 text-muted-foreground" />
          <p className="mt-4 text-sm font-semibold text-white">No history yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Activity will appear here once you create, update, archive, restore, or delete records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentHistory.map((event) => {
            const label = getEventLabel(event);
            const timeAgo = formatDistanceToNowStrict(parseISO(event.timestamp), { addSuffix: true });

            return (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-xl p-2 border border-white/10 bg-white/5", label.accent)}>
                    {EVENT_ICONS[event.type]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {label.label} {event.entityType.replace("credit-card", "credit card")}
                      <span className="text-muted-foreground"> — {event.entityName}</span>
                    </p>
                    {event.details && (
                      <p className="mt-1 text-xs text-muted-foreground">{event.details}</p>
                    )}
                  </div>
                  <span className="ml-auto text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
