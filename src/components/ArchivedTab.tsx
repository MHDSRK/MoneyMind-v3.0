import { useMemo } from "react";
import {
  ArchiveRestore,
  BriefcaseBusiness,
  CreditCard,
  HandCoins,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import {
  restoreRecord,
  useStore,
} from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";

function sortByArchivedDate<T extends { archivedAt?: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.archivedAt ?? 0).getTime() -
      new Date(a.archivedAt ?? 0).getTime()
  );
}

type ArchivedGroupProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isEmpty: boolean;
};

function ArchivedGroup({
  title,
  icon,
  children,
  isEmpty,
}: ArchivedGroupProps) {
  if (isEmpty) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>

      <div className="space-y-2">{children}</div>
    </section>
  );
}

type ArchivedRowProps = {
  title: string;
  subtitle?: string;
  amount: number;
  archivedAt?: string;
  onRestore: () => void;
};

function ArchivedRow({
  title,
  subtitle,
  amount,
  archivedAt,
  onRestore,
}: ArchivedRowProps) {
  const archivedDate = archivedAt
    ? new Date(archivedAt).toLocaleDateString()
    : "Unknown date";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Archived on {archivedDate}
          </p>
        </div>

        <p className="shrink-0 text-sm font-semibold text-muted-foreground">
          {formatCurrency(amount)}
        </p>
      </div>

      <button
        type="button"
        onClick={onRestore}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <ArchiveRestore className="h-3.5 w-3.5" />
        Restore
      </button>
    </div>
  );
}

export default function ArchivedTab() {
  const { store, updateStore } = useStore();

  const archivedAccounts = useMemo(
    () =>
      sortByArchivedDate(
        store.accounts.filter(
          (item) => !item.deleted && Boolean(item.archivedAt)
        )
      ),
    [store.accounts]
  );

  const archivedCards = useMemo(
    () =>
      sortByArchivedDate(
        store.creditCards.filter(
          (item) => !item.deleted && Boolean(item.archivedAt)
        )
      ),
    [store.creditCards]
  );

  const archivedLoans = useMemo(
    () =>
      sortByArchivedDate(
        store.loans.filter(
          (item) => !item.deleted && Boolean(item.archivedAt)
        )
      ),
    [store.loans]
  );

  const archivedLiabilities = useMemo(
    () =>
      sortByArchivedDate(
        store.liabilities.filter(
          (item) => !item.deleted && Boolean(item.archivedAt)
        )
      ),
    [store.liabilities]
  );

  const hasArchivedRecords =
    archivedAccounts.length > 0 ||
    archivedCards.length > 0 ||
    archivedLoans.length > 0 ||
    archivedLiabilities.length > 0;

  const restoreAccount = (id: string) => {
    updateStore((previous) => ({
      ...previous,
      accounts: restoreRecord(previous.accounts, id),
    }));

    toast.success("Account restored", {
      description: "The account is active and included in totals again.",
    });
  };

  const restoreCard = (id: string) => {
    updateStore((previous) => ({
      ...previous,
      creditCards: restoreRecord(previous.creditCards, id),
    }));

    toast.success("Credit card restored", {
      description: "The card is active and included in totals again.",
    });
  };

  const restoreLoan = (id: string) => {
    updateStore((previous) => ({
      ...previous,
      loans: restoreRecord(previous.loans, id),
    }));

    toast.success("Loan restored", {
      description: "The loan is active and included in totals again.",
    });
  };

  const restoreLiability = (id: string) => {
    updateStore((previous) => ({
      ...previous,
      liabilities: restoreRecord(previous.liabilities, id),
    }));

    toast.success("Liability restored", {
      description: "The liability is active and included in totals again.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-5">
      <div>
        <h1 className="text-xl font-bold text-white">Archived</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Archived records are excluded from active totals and can be restored anytime.
        </p>
      </div>

      {!hasArchivedRecords ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center">
          <ArchiveRestore className="mx-auto h-9 w-9 text-muted-foreground" />
          <p className="mt-4 text-sm font-semibold text-white">
            No archived records
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Archived assets, cards, loans, and liabilities will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          <ArchivedGroup
            title="Assets"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            isEmpty={archivedAccounts.length === 0}
          >
            {archivedAccounts.map((account) => (
              <ArchivedRow
                key={account.id}
                title={account.name}
                subtitle={account.type}
                amount={account.balance}
                archivedAt={account.archivedAt}
                onRestore={() => restoreAccount(account.id)}
              />
            ))}
          </ArchivedGroup>

          <ArchivedGroup
            title="Credit Cards"
            icon={<CreditCard className="h-4 w-4" />}
            isEmpty={archivedCards.length === 0}
          >
            {archivedCards.map((card) => (
              <ArchivedRow
                key={card.id}
                title={card.name}
                subtitle={`${card.provider || "Credit Card"} • Limit ${formatCurrency(card.creditLimit)}`}
                amount={card.outstanding}
                archivedAt={card.archivedAt}
                onRestore={() => restoreCard(card.id)}
              />
            ))}
          </ArchivedGroup>

          <ArchivedGroup
            title="Loans"
            icon={<Landmark className="h-4 w-4" />}
            isEmpty={archivedLoans.length === 0}
          >
            {archivedLoans.map((loan) => (
              <ArchivedRow
                key={loan.id}
                title={loan.name}
                subtitle={loan.lender || "Loan"}
                amount={loan.outstanding}
                archivedAt={loan.archivedAt}
                onRestore={() => restoreLoan(loan.id)}
              />
            ))}
          </ArchivedGroup>

          <ArchivedGroup
            title="More Liabilities"
            icon={<HandCoins className="h-4 w-4" />}
            isEmpty={archivedLiabilities.length === 0}
          >
            {archivedLiabilities.map((liability) => (
              <ArchivedRow
                key={liability.id}
                title={liability.name}
                subtitle={liability.group || "Liability"}
                amount={liability.amount}
                archivedAt={liability.archivedAt}
                onRestore={() => restoreLiability(liability.id)}
              />
            ))}
          </ArchivedGroup>
        </div>
      )}
    </div>
  );
}
