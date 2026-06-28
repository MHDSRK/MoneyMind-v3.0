import { useState, useEffect, useRef } from "react";
import { useStore, Account, archiveRecord } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { MasterListRow } from "@/components/MasterListRow";
import { RecordDetailsDialog } from "@/components/RecordDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isTrackingAccount } from "@/lib/calculations";
import { formatDisplayDate } from "@/utils/date";

export function AssetsTab() {
  const { store, updateStore } = useStore();
  const [location] = useLocation();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [accountPendingArchive, setAccountPendingArchive] = useState<Account | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const accountRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const visibleAccounts = store.accounts.filter((account) => !account.deleted && !account.archivedAt);
  const bankAccounts = visibleAccounts.filter((a) => a.type === "cash" || a.type === "bank");
  const businessAccounts = visibleAccounts.filter((a) => a.type === "business");
  const investmentAccounts = visibleAccounts.filter((a) => a.type === "investments" || a.type === "investment");
  const insuranceAccounts = visibleAccounts.filter((a) => a.type === "insurance");
  const lentAccounts = visibleAccounts.filter(
    (account) => account.type === "other" && isTrackingAccount(account)
  );

  const bankTotal = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
  const businessTotal = businessAccounts.reduce((sum, account) => sum + account.balance, 0);
  const investmentTotal = investmentAccounts.reduce((sum, account) => sum + account.balance, 0);
  const insuranceTotal = insuranceAccounts.reduce((sum, account) => sum + account.balance, 0);
  const lentTotal = lentAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalAssets = bankTotal + businessTotal + investmentTotal + insuranceTotal;
  const [expandedSection, setExpandedSection] = useState<string | undefined>("bank");

  useEffect(() => {
    if (!location.startsWith("/assets")) {
      return;
    }

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      return;
    }

    const target = store.accounts.find((account) => account.id === focusId && !account.deleted);
    if (!target) {
      return;
    }

    setHighlightedId(focusId);

    const timeout = window.setTimeout(() => {
      setHighlightedId((previous) => (previous === focusId ? null : previous));
    }, 2500);

    window.requestAnimationFrame(() => {
      accountRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.clearTimeout(timeout);
  }, [location, store.accounts]);


  const promptArchiveAccount = (account: Account) => {
    setAccountPendingArchive(account);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveAccount = () => {
    if (!accountPendingArchive) return;

    updateStore((prev) => ({
      ...prev,
      accounts: archiveRecord(prev.accounts, accountPendingArchive.id),
    }));

    toast({ title: "Account archived", description: "The account was archived and removed from active totals." });
    setArchiveDialogOpen(false);
    setAccountPendingArchive(null);
  };

  const cancelArchiveAccount = () => {
    setArchiveDialogOpen(false);
    setAccountPendingArchive(null);
  };

  const openAccountDetails = (account: Account) => {
    if (isTrackingAccount(account)) {
      setSelectedAccount(account);
    }
  };

  const isLentAccount = (account: Account) => isTrackingAccount(account);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-foreground">Assets</h2>
        <div className={totalAssets < 0 ? "text-destructive text-2xl font-bold" : "text-primary neon-text text-2xl font-bold"}>
          {formatCurrency(totalAssets)}
        </div>
      </div>

      <Accordion type="single" collapsible value={expandedSection} onValueChange={setExpandedSection} className="space-y-3">
        <AccordionItem value="bank">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 flex-1 text-left">Bank & Cash</span>
            <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(bankTotal)}</span>
          </AccordionTrigger>
          <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
            {bankAccounts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No bank or cash accounts yet.</div>
            ) : (
              bankAccounts.map((account) => (
                <div
                  key={account.id}
                  ref={(element) => { accountRefs.current[account.id] = element; }}
                  className={highlightedId === account.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                >
                  <MasterListRow
                    name={account.name}
                    subtitle={account.type === "cash" ? "Cash" : "Bank"}
                    amount={account.balance}
                    onClick={() => openAccountDetails(account)}
                    onArchive={() => promptArchiveAccount(account)}
                    interactive={false}
                  />
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="business">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 flex-1 text-left">Business</span>
            <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(businessTotal)}</span>
          </AccordionTrigger>
          <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
            {businessAccounts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No business accounts yet.</div>
            ) : (
              businessAccounts.map((account) => (
                <div
                  key={account.id}
                  ref={(element) => { accountRefs.current[account.id] = element; }}
                  className={highlightedId === account.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                >
                  <MasterListRow
                    name={account.name}
                    subtitle="Business"
                    amount={account.balance}
                    onClick={() => openAccountDetails(account)}
                    onArchive={() => promptArchiveAccount(account)}
                    interactive={false}
                  />
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="investments">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 flex-1 text-left">Investments</span>
            <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(investmentTotal)}</span>
          </AccordionTrigger>
          <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
            {investmentAccounts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No investment accounts yet.</div>
            ) : (
              investmentAccounts.map((account) => (
                <div
                  key={account.id}
                  ref={(element) => { accountRefs.current[account.id] = element; }}
                  className={highlightedId === account.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                >
                  <MasterListRow
                    name={account.name}
                    subtitle="Investments"
                    amount={account.balance}
                    onClick={() => openAccountDetails(account)}
                    onArchive={() => promptArchiveAccount(account)}
                    interactive={false}
                  />
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="insurance">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 flex-1 text-left">Insurance</span>
            <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(insuranceTotal)}</span>
          </AccordionTrigger>
          <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
            {insuranceAccounts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No insurance accounts yet.</div>
            ) : (
              insuranceAccounts.map((account) => (
                <div
                  key={account.id}
                  ref={(element) => { accountRefs.current[account.id] = element; }}
                  className={highlightedId === account.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                >
                  <MasterListRow
                    name={account.name}
                    subtitle="Insurance"
                    amount={account.balance}
                    onClick={() => openAccountDetails(account)}
                    onArchive={() => promptArchiveAccount(account)}
                    interactive={false}
                  />
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="lent">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground">
            <span className="min-w-0 flex-1 text-left">Lent</span>
            <span className="ml-4 flex-shrink-0 text-right text-sm font-bold">{formatCurrency(lentTotal)}</span>
          </AccordionTrigger>
          <AccordionContent className="rounded-2xl border border-white/10 bg-white/5 px-0 py-0">
            {lentAccounts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No lent accounts yet.</div>
            ) : (
              lentAccounts.map((account) => (
                <div
                  key={account.id}
                  ref={(element) => { accountRefs.current[account.id] = element; }}
                  className={highlightedId === account.id ? "ring-2 ring-primary/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]" : ""}
                >
                  <MasterListRow
                    name={account.name}
                    subtitle="Lent"
                    amount={account.balance}
                    onClick={() => openAccountDetails(account)}
                    onArchive={() => promptArchiveAccount(account)}
                    interactive={isLentAccount(account)}
                  />
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <RecordDetailsDialog
        open={Boolean(selectedAccount && isLentAccount(selectedAccount))}
        title={selectedAccount?.name ?? "Account details"}
        description="Review lent account details and archive from here."
        details={
          selectedAccount && isLentAccount(selectedAccount)
            ? [
                { label: "Name", value: selectedAccount.name },
                { label: "Amount", value: formatCurrency(selectedAccount.balance) },
                { label: "Last Updated", value: formatDisplayDate(selectedAccount.updatedAt, "Unknown") },
              ]
            : []
        }
        footerActions={
          selectedAccount
            ? [
                {
                  key: "archive",
                  label: "Archive",
                  variant: "warning",
                  onClick: () => promptArchiveAccount(selectedAccount),
                },
                {
                  key: "close",
                  label: "Close",
                  variant: "primary",
                  onClick: () => setSelectedAccount(null),
                },
              ]
            : [{ key: "close", label: "Close", variant: "primary", onClick: () => setSelectedAccount(null) }]
        }
        onClose={() => setSelectedAccount(null)}
      >
        {selectedAccount && isLentAccount(selectedAccount) ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Notes</p>
              <div className="min-h-[96px] whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-foreground">
                {selectedAccount.notes?.trim() ? selectedAccount.notes : "-"}
              </div>
            </div>
          </div>
        ) : null}
      </RecordDetailsDialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => !open && cancelArchiveAccount()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{accountPendingArchive?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Archived items will no longer appear in active lists.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelArchiveAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmArchiveAccount} className="bg-destructive text-white hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
