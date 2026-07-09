import { useEffect, useRef, useState } from "react";
import { useStore, LiabilityItem, archiveRecord, restoreRecord } from "@/hooks/useStore";
import { getLiabilityGroupTotals } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { MasterListRow } from "@/components/MasterListRow";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PaymentHistorySheet } from "@/components/PaymentHistorySheet";
import { formatDisplayDate, formatAppDate } from "@/utils/date";

const GROUPS = ["Regular Expenses", "Chitty", "Borrow", "More Liabilities"];

export function LiabilitiesTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [liabilityPendingArchive, setLiabilityPendingArchive] = useState<LiabilityItem | null>(null);
  const [paymentSheetItemId, setPaymentSheetItemId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showArchivedExpenses, setShowArchivedExpenses] = useState(false);
  const liabilityRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedLiability = selectedLiabilityId
    ? store.liabilities.find((item) => item.id === selectedLiabilityId) ?? null
    : null;

  const visibleLiabilities = store.liabilities.filter((item) => !item.deleted && !item.archivedAt);
  const groupedLiabilities = visibleLiabilities.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, LiabilityItem[]>);

  const groupTotals = getLiabilityGroupTotals(store);
  const totalLiabilities = visibleLiabilities.reduce((sum, item) => sum + item.amount, 0);

  const archivedRegularExpenses = store.liabilities
    .filter((item) => item.group === "Regular Expenses" && !item.deleted && Boolean(item.archivedAt))
    .sort((a, b) => new Date(b.archivedAt ?? 0).getTime() - new Date(a.archivedAt ?? 0).getTime());
  const [expandedGroup, setExpandedGroup] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!location.startsWith("/others")) return;

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) return;

    const target = store.liabilities.find((item) => item.id === focusId && !item.deleted);
    if (!target) return;

    setHighlightedId(focusId);
    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      liabilityRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.liabilities]);


  const promptArchiveLiability = (item: LiabilityItem) => {
    setLiabilityPendingArchive(item);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveLiability = () => {
    if (!liabilityPendingArchive) return;

    updateStore((prev) => ({ ...prev, liabilities: archiveRecord(prev.liabilities, liabilityPendingArchive.id) }));
    toast({ title: "Liability archived", description: "The liability was archived and removed from active totals." });
    setArchiveDialogOpen(false);
    setLiabilityPendingArchive(null);
  };

  const cancelArchiveLiability = () => {
    setArchiveDialogOpen(false);
    setLiabilityPendingArchive(null);
  };

  const handleRestoreLiability = (id: string) => {
    updateStore((prev) => ({ ...prev, liabilities: restoreRecord(prev.liabilities, id) }));
    toast({ title: "Liability restored", description: "The liability was restored to active totals." });
  };

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">More</h2>
        </div>
        <div className="text-2xl font-bold text-destructive">{formatCurrency(totalLiabilities)}</div>
      </div>

      <Accordion type="single" collapsible value={expandedGroup} onValueChange={setExpandedGroup} className="space-y-3">
        {GROUPS.map((group) => {
          const items = groupedLiabilities[group] || [];
          const groupTotal = groupTotals[group] ?? 0;

          return (
            <AccordionItem key={group} value={group}>
              <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
                <span className="min-w-0 flex-1 text-left">{group}</span>
                <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(groupTotal)}</span>
              </AccordionTrigger>
              <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
                {items.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">No items yet.</div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      ref={(element) => { liabilityRefs.current[item.id] = element; }}
                      className={highlightedId === item.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                    >
                  <MasterListRow
                    name={item.name}
                    subtitle={item.dueDate ? `Due • ${formatAppDate(item.dueDate)}` : `Group • ${item.group}`}
                    amount={item.amount}
                    onClick={() => setSelectedLiabilityId(item.id)}
                    onArchive={() => promptArchiveLiability(item)}
                  />
                    </div>
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {archivedRegularExpenses.length > 0 && (
        <div className="glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowArchivedExpenses((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-white">Archived ({archivedRegularExpenses.length})</p>
              <p className="text-xs text-muted-foreground">Restore archived regular expenses.</p>
            </div>
            {showArchivedExpenses ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showArchivedExpenses && (
            <div className="space-y-2 border-t border-white/10 p-4">
              {archivedRegularExpenses.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Archived {formatDisplayDate(item.archivedAt, "unknown")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreLiability(item.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <RecordDetailsDialog
        open={Boolean(selectedLiability)}
        title={selectedLiability?.name ?? "Liability details"}
        description="Review liability details and archive from here."
        details={
          selectedLiability
            ? [
                { label: "Amount", value: formatCurrency(selectedLiability.amount) },
                { label: "Group", value: selectedLiability.group },
                { label: "Due Date", value: formatDisplayDate(selectedLiability.dueDate, "Not set") },
                { label: "Notes", value: selectedLiability.notes?.trim() ? selectedLiability.notes : "Not set" },
              ]
            : []
        }
        footerActions={
          selectedLiability
            ? [
                {
                  key: "history",
                  label: "History",
                  variant: "secondary",
                  onClick: () => setPaymentSheetItemId(selectedLiability.id),
                },
                {
                  key: "archive",
                  label: "Archive",
                  variant: "warning",
                  onClick: () => promptArchiveLiability(selectedLiability),
                },
                {
                  key: "close",
                  label: "Close",
                  variant: "primary",
                  onClick: () => setSelectedLiabilityId(null),
                },
              ]
            : [{ key: "close", label: "Close", variant: "primary", onClick: () => setSelectedLiabilityId(null) }]
        }
        onClose={() => setSelectedLiabilityId(null)}
      />

      <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => !open && cancelArchiveLiability()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{liabilityPendingArchive?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Archived items will no longer contribute to active totals.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelArchiveLiability}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmArchiveLiability} className="bg-destructive text-white hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {paymentSheetItemId && (() => {
        const item = store.liabilities.find((l) => l.id === paymentSheetItemId);
        if (!item) return null;
        return (
          <PaymentHistorySheet
            open
            onClose={() => setPaymentSheetItemId(null)}
            entityType="liability"
            entityId={item.id}
            entityName={item.name}
            outstanding={item.amount}
          />
        );
      })()}
    </div>
  );
}
