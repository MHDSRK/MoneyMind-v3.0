import { useMemo, useState } from "react";
import { useStore, Account, CreditCard, Loan, LiabilityItem, updateAccount, updateCreditCard, updateLoan, updateLiability } from "@/hooks/useStore";
import { EditAccordion } from "@/components/EditAccordion";
import { EditableField } from "@/components/EditableField";
import { EditDialog } from "@/components/EditDialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { formatDisplayDate } from "@/utils/date";

type EditableEntity =
  | { type: "account"; item: Account }
  | { type: "credit-card"; item: CreditCard }
  | { type: "loan"; item: Loan }
  | { type: "liability"; item: LiabilityItem };

interface DialogConfig {
  open: boolean;
  entity?: EditableEntity;
  field?: string;
  value?: string;
  title?: string;
  description?: string;
}

function groupRecords(store: ReturnType<typeof useStore>['store'], query: string) {
  const normalized = query.trim().toLowerCase();
  const filterName = (name: string) => !normalized || name.toLowerCase().includes(normalized);

  const assets = store.accounts.filter(
    (item) => !item.deleted && !item.archivedAt && ['cash', 'bank', 'business'].includes(item.type ?? '') && filterName(item.name)
  );
  const investments = store.accounts.filter(
    (item) => !item.deleted && !item.archivedAt && item.type === 'investments' && filterName(item.name)
  );
  const insurance = store.accounts.filter(
    (item) => !item.deleted && !item.archivedAt && item.type === 'insurance' && filterName(item.name)
  );
  const lent = store.accounts.filter(
    (item) => !item.deleted && !item.archivedAt && item.type === 'other' && filterName(item.name)
  );
  const creditCards = store.creditCards.filter(
    (item) => !item.deleted && !item.archivedAt && filterName(item.name)
  );
  const loans = store.loans.filter(
    (item) => !item.deleted && !item.archivedAt && filterName(item.name)
  );
  const regularExpenses = store.liabilities.filter(
    (item) => !item.deleted && !item.archivedAt && item.group === 'Regular Expenses' && filterName(item.name)
  );
  const borrowed = store.liabilities.filter(
    (item) => !item.deleted && !item.archivedAt && item.group === 'Borrow' && filterName(item.name)
  );

  return { assets, investments, insurance, lent, creditCards, loans, regularExpenses, borrowed };
}

export function EditPage() {
  const { store, updateStore } = useStore();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogConfig>({ open: false });

  const groups = useMemo(() => groupRecords(store, query), [store, query]);

  const createAccount = (type: "cash" | "bank" | "business" | "investments" | "insurance" | "other") => {
    updateStore((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          id: crypto.randomUUID(),
          name: "New Account",
          type,
          group: "accounts",
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    toast({ title: "Account added", description: "A new account was added." });
  };

  const createCreditCard = () => {
    updateStore((prev) => ({
      ...prev,
      creditCards: [
        ...prev.creditCards,
        {
          id: crypto.randomUUID(),
          name: "New Card",
          provider: "",
          cardType: "",
          creditLimit: 0,
          outstanding: 0,
          unbilled: 0,
          statementDate: 1,
          dueDate: 15,
          nextDueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    toast({ title: "Credit card added", description: "A new credit card was added." });
  };

  const createLoan = () => {
    updateStore((prev) => ({
      ...prev,
      loans: [
        ...prev.loans,
        {
          id: crypto.randomUUID(),
          name: "New Loan",
          lender: "",
          principal: 0,
          interestRate: 0,
          emi: 0,
          emiAmount: 0,
          emiCount: 60,
          paidCount: 0,
          emiFrequency: "monthly",
          outstanding: 0,
          remainingMonths: 0,
          startDate: new Date().toISOString().split("T")[0],
          nextEmiDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    toast({ title: "Loan added", description: "A new loan was added." });
  };

  const createLiability = (group: string) => {
    updateStore((prev) => ({
      ...prev,
      liabilities: [
        ...prev.liabilities,
        {
          id: crypto.randomUUID(),
          group,
          name: "New Item",
          amount: 0,
          dueDate: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    toast({ title: "Liability added", description: "A new liability was added." });
  };

  const updateField = (entity: EditableEntity, field: string, value: string) => {
    const parsedNumber = Number(value);

    updateStore((prev) => {
      if (entity.type === 'account') {
        const change: Partial<Account> = field === 'Balance' ? { balance: Number.isFinite(parsedNumber) ? parsedNumber : entity.item.balance } : { name: value };
        return updateAccount(prev, entity.item.id, change);
      }

      if (entity.type === 'credit-card') {
        const change: Partial<CreditCard> = {};
        switch (field) {
          case 'Card Name':
            change.name = value;
            break;
          case 'Provider':
            change.provider = value;
            break;
          case 'Card Type':
            change.cardType = value;
            break;
          case 'Credit Limit':
            change.creditLimit = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.creditLimit;
            break;
          case 'Outstanding':
            change.outstanding = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.outstanding;
            break;
          case 'Unbilled':
            change.unbilled = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.unbilled ?? 0;
            break;
          case 'Due Date':
            change.dueDate = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.dueDate;
            break;
          case 'Next Bill Date':
            change.nextDueDate = value;
            break;
        }
        return updateCreditCard(prev, entity.item.id, change);
      }

      if (entity.type === 'loan') {
        const change: Partial<Loan> = {};
        switch (field) {
          case 'Loan Name':
            change.name = value;
            break;
          case 'Tag':
            change.tag = value;
            break;
          case 'Total Loan':
            change.principal = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.principal;
            break;
          case 'Outstanding Balance':
            change.outstanding = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.outstanding;
            break;
          case 'EMI / Month':
            change.emiAmount = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.emiAmount;
            break;
          case 'Next EMI':
            change.nextEmiDate = value;
            break;
          case 'Remaining Months':
            if (Number.isFinite(parsedNumber)) {
              change.emiCount = (entity.item.paidCount ?? 0) + parsedNumber;
            }
            break;
        }
        return updateLoan(prev, entity.item.id, change);
      }

      if (entity.type === 'liability') {
        const change: Partial<LiabilityItem> = {};
        switch (field) {
          case 'Expense Name':
            change.name = value;
            break;
          case 'Amount':
            change.amount = Number.isFinite(parsedNumber) ? parsedNumber : entity.item.amount;
            break;
          case 'Due Date':
            change.dueDate = value;
            break;
        }
        return updateLiability(prev, entity.item.id, change);
      }

      return prev;
    });
  };

  const openEditDialog = (entity: EditableEntity, field: string, currentValue: string, title: string, description?: string) => {
    setDialog({ open: true, entity, field, value: currentValue, title, description });
  };

  const handleDialogSave = (newValue: string) => {
    if (!dialog.entity || !dialog.field) return;
    updateField(dialog.entity, dialog.field, newValue);
  };

  const renderRecord = (entity: EditableEntity) => {
    const id = `${entity.type}-${entity.item.id}`;
    const isOpen = expandedId === id;
    const toggle = () => setExpandedId((prev) => (prev === id ? null : id));

    if (entity.type === 'account') {
      return (
        <EditAccordion key={id} label={entity.item.name} isOpen={isOpen} onToggle={toggle}>
          <EditableField label="Account Name" value={entity.item.name} onEdit={() => openEditDialog(entity, 'Account Name', entity.item.name, 'Edit account name')} />
          <EditableField label="Balance" value={formatCurrency(entity.item.balance)} onEdit={() => openEditDialog(entity, 'Balance', entity.item.balance.toString(), 'Edit account balance')} />
        </EditAccordion>
      );
    }

    if (entity.type === 'credit-card') {
      return (
        <EditAccordion key={id} label={entity.item.name} isOpen={isOpen} onToggle={toggle}>
          <EditableField label="Card Name" value={entity.item.name} onEdit={() => openEditDialog(entity, 'Card Name', entity.item.name, 'Edit card name')} />
          <EditableField label="Provider" value={entity.item.provider || 'Not set'} onEdit={() => openEditDialog(entity, 'Provider', entity.item.provider || '', 'Edit provider')} />
          <EditableField label="Card Type" value={entity.item.cardType || 'Not set'} onEdit={() => openEditDialog(entity, 'Card Type', entity.item.cardType || '', 'Edit card type')} />
          <EditableField label="Credit Limit" value={formatCurrency(entity.item.creditLimit)} onEdit={() => openEditDialog(entity, 'Credit Limit', entity.item.creditLimit.toString(), 'Edit credit limit')} />
          <EditableField label="Outstanding" value={formatCurrency(entity.item.outstanding)} onEdit={() => openEditDialog(entity, 'Outstanding', entity.item.outstanding.toString(), 'Edit outstanding amount')} />
          <EditableField label="Unbilled" value={formatCurrency(entity.item.unbilled ?? 0)} onEdit={() => openEditDialog(entity, 'Unbilled', String(entity.item.unbilled ?? 0), 'Edit unbilled amount')} />
          <EditableField label="Due Date" value={String(entity.item.dueDate)} onEdit={() => openEditDialog(entity, 'Due Date', String(entity.item.dueDate), 'Edit due date')} />
          <EditableField label="Next Bill Date" value={formatDisplayDate(entity.item.nextDueDate, 'Not set')} onEdit={() => openEditDialog(entity, 'Next Bill Date', entity.item.nextDueDate ? entity.item.nextDueDate.split('T')[0] : '', 'Edit next bill date')} />
        </EditAccordion>
      );
    }

    if (entity.type === 'loan') {
      return (
        <EditAccordion key={id} label={entity.item.name} isOpen={isOpen} onToggle={toggle}>
          <EditableField label="Loan Name" value={entity.item.name} onEdit={() => openEditDialog(entity, 'Loan Name', entity.item.name, 'Edit loan name')} />
          <EditableField label="Tag" value={entity.item.tag || 'Not set'} onEdit={() => openEditDialog(entity, 'Tag', entity.item.tag || '', 'Edit loan tag')} />
          <EditableField label="Total Loan" value={formatCurrency(entity.item.principal)} onEdit={() => openEditDialog(entity, 'Total Loan', entity.item.principal.toString(), 'Edit total loan amount')} />
          <EditableField label="Outstanding Balance" value={formatCurrency(entity.item.outstanding)} onEdit={() => openEditDialog(entity, 'Outstanding Balance', entity.item.outstanding.toString(), 'Edit outstanding balance')} />
          <EditableField label="EMI / Month" value={formatCurrency(entity.item.emiAmount)} onEdit={() => openEditDialog(entity, 'EMI / Month', entity.item.emiAmount.toString(), 'Edit EMI amount')} />
          <EditableField label="Next EMI" value={formatDisplayDate(entity.item.nextEmiDate, 'Not set')} onEdit={() => openEditDialog(entity, 'Next EMI', entity.item.nextEmiDate || '', 'Edit next EMI date')} />
          <EditableField label="Remaining Months" value={String((entity.item.emiCount ?? 0) - (entity.item.paidCount ?? 0))} onEdit={() => openEditDialog(entity, 'Remaining Months', String((entity.item.emiCount ?? 0) - (entity.item.paidCount ?? 0)), 'Edit remaining months')} />
        </EditAccordion>
      );
    }

    if (entity.type === 'liability') {
      return (
        <EditAccordion key={id} label={entity.item.name} isOpen={isOpen} onToggle={toggle}>
          <EditableField label="Expense Name" value={entity.item.name} onEdit={() => openEditDialog(entity, 'Expense Name', entity.item.name, 'Edit expense name')} />
          <EditableField label="Amount" value={formatCurrency(entity.item.amount)} onEdit={() => openEditDialog(entity, 'Amount', entity.item.amount.toString(), 'Edit amount')} />
          <EditableField label="Due Date" value={entity.item.dueDate || 'Not set'} onEdit={() => openEditDialog(entity, 'Due Date', entity.item.dueDate || '', 'Edit due date')} />
        </EditAccordion>
      );
    }

    return null;
  };

  const hasRecords = Object.values(groups).some((records) => records.length > 0);

  return (
    <div className="pb-32 px-4 pt-24 space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Records</h1>
            <p className="text-sm text-muted-foreground">Modify master records from one place.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {!hasRecords ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
          No records match your search.
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Assets</p>
            <button
              type="button"
              onClick={() => createAccount("cash")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Asset
            </button>
          </div>
          <div className="space-y-2">
            {groups.assets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No assets found.</div>
            ) : (
              groups.assets.map((item) => renderRecord({ type: 'account', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Investments</p>
            <button
              type="button"
              onClick={() => createAccount("investments")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Investment
            </button>
          </div>
          <div className="space-y-2">
            {groups.investments.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No investments found.</div>
            ) : (
              groups.investments.map((item) => renderRecord({ type: 'account', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Insurance</p>
            <button
              type="button"
              onClick={() => createAccount("insurance")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Insurance
            </button>
          </div>
          <div className="space-y-2">
            {groups.insurance.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No insurance accounts found.</div>
            ) : (
              groups.insurance.map((item) => renderRecord({ type: 'account', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Lent</p>
            <button
              type="button"
              onClick={() => createAccount("other")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Lent Item
            </button>
          </div>
          <div className="space-y-2">
            {groups.lent.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No lent accounts found.</div>
            ) : (
              groups.lent.map((item) => renderRecord({ type: 'account', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Credit Cards</p>
            <button
              type="button"
              onClick={createCreditCard}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Card
            </button>
          </div>
          <div className="space-y-2">
            {groups.creditCards.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No credit cards found.</div>
            ) : (
              groups.creditCards.map((item) => renderRecord({ type: 'credit-card', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Loans</p>
            <button
              type="button"
              onClick={createLoan}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Loan
            </button>
          </div>
          <div className="space-y-2">
            {groups.loans.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No loans found.</div>
            ) : (
              groups.loans.map((item) => renderRecord({ type: 'loan', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Regular Expenses</p>
            <button
              type="button"
              onClick={() => createLiability("Regular Expenses")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Expense
            </button>
          </div>
          <div className="space-y-2">
            {groups.regularExpenses.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No regular expenses found.</div>
            ) : (
              groups.regularExpenses.map((item) => renderRecord({ type: 'liability', item }))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Borrowed</p>
            <button
              type="button"
              onClick={() => createLiability("Borrow")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white/10"
            >
              Add Borrowed Item
            </button>
          </div>
          <div className="space-y-2">
            {groups.borrowed.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No borrowed items found.</div>
            ) : (
              groups.borrowed.map((item) => renderRecord({ type: 'liability', item }))
            )}
          </div>
        </div>
      </div>

      <EditDialog
        open={dialog.open}
        title={dialog.title ?? "Edit field"}
        description={dialog.description}
        value={dialog.value ?? ""}
        type={dialog.field === 'Due Date' || dialog.field === 'Next Bill Date' || dialog.field === 'Next EMI' ? 'date' : dialog.field === 'Credit Limit' || dialog.field === 'Outstanding' || dialog.field === 'Unbilled' || dialog.field === 'Balance' || dialog.field === 'Total Loan' || dialog.field === 'Outstanding Balance' || dialog.field === 'EMI / Month' || dialog.field === 'Amount' || dialog.field === 'Remaining Months' ? 'number' : 'text'}
        onClose={() => setDialog({ open: false })}
        onSave={handleDialogSave}
      />
    </div>
  );
}
