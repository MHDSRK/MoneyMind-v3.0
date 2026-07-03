# MoneyMind — Business Rules Specification

**Version:** 1.0
**Applies to:** MoneyMind v3.x
**Status:** Living Document
**Last Reviewed:** 2026-07-03

This document is the canonical source of truth for MoneyMind's financial logic.
Every rule below is tagged with a status:

- ✅ **Verified** — confirmed directly in current source code.
- ⚠️ **Pending Verification** — believed true, not yet confirmed against code/tests.
- 🚧 **Planned** — intended behavior, not yet implemented.

Do not treat unverified rules as fact. Update this file whenever business logic changes.

Rules use category-prefixed IDs (`FIN`, `LENT`, `BORROW`, `CARD`, `LOAN`, `CAT`,
`ARCH`, `TXN`, `REFRESH`, `DATE`) instead of a flat sequence, so the document stays
navigable as it grows. Old flat `BR-XXX` numbers are kept in parentheses for
continuity with earlier discussion.

## Application Invariants

These must **never** become false. Each is a strong candidate for an automated
regression test if one doesn't already exist.

- Total Assets ≥ 0
- Loan Outstanding ≥ 0
- Credit Card Outstanding ≥ 0
- Available Credit ≤ Credit Limit
- Remaining EMIs ≥ 0 (enforced via `max(0, emiCount − paidCount)`)
- Archived records are excluded from every calculation (FIN-002)
- Deleted records are excluded from every calculation (FIN-002)
- Lent balance never contributes to Total Assets or Net Worth (LENT-001)

*Status of the invariants as a group: ✅ Verified (with added automated checks)*

Note: the calculation functions apply filters that exclude archived/deleted records
and separate lent/tracking accounts. An automated invariant test suite has been
added (`src/lib/__tests__/invariants.test.ts`) to assert the core invariants
(non-negative totals, archived/deleted exclusion). If runtime assertions are
desired, we can add optional checks into `calculateMetrics()`.

---

## 1. Financial Calculation Rules

### FIN-001 (BR-001) — Net Worth Formula
**Status:** ✅ Verified

```
Net Worth = Total Assets − Total Liabilities
Total Liabilities = Credit Card Outstanding + Loan Outstanding + Manual Liabilities
```

**Source:** `src/lib/calculations.ts` (`totalLiabilities`, `netWorth`)

### FIN-002 (BR-002) — Only Active Records Count
**Status:** ✅ Verified

Dashboard, Assets, Liabilities, and Net Worth calculations only include records where
`deleted !== true` and `archivedAt` is unset. Archived/deleted records are excluded
from every total.

**Source:** `src/lib/calculations.ts` (`activeFinancialAccounts`, `activeCreditCards`,
`activeLoans`, `activeLiabilities` filters)

---

## 2. Lent Rules

### LENT-001 (BR-003) — Lent Exclusion
**Status:** ✅ Verified

Lent is a tracking record only. It must never participate in:
- Total Assets
- Net Worth
- Available Balance / dashboard summaries

**Source:** `src/lib/calculations.ts` lines ~293–357 (explicit comment: *"Tracking-only
Lent records are stored separately and never participate in asset totals, net worth,
available balance, dashboard summaries, or reports."*). Lent accounts are excluded from
`activeFinancialAccounts` via `isLentAccount()`/`getActiveLentAccounts()`.

**Affected files:** `calculations.ts`, `AssetsTab.tsx`, `HomeTab.tsx`

**Regression test:** `src/lib/__tests__/calculations.lent.test.ts`

### LENT-002 (BR-004) — Lent Effects on Transactions
**Status:** ✅ Verified (function exists, exact math not re-derived)

- Money Out → Lent → applies via `applyLentExpense()`
- Money In → Lent Pay Back → reduces the matching Lent record via `applyLentPayBack()`

**Source:** `src/lib/transactionEffects.ts`

---

## 3. Borrow Rules

### BORROW-001 (BR-005) — Borrow Effects on Transactions
**Status:** ✅ Verified (function exists, exact math not re-derived)

- Money In → Borrow → creates/updates a Borrow liability via `applyBorrowIncome()`
- Money Out → Borrow Pay Back → reduces the matching Borrow record via `applyBorrowPayBack()`

**Source:** `src/lib/transactionEffects.ts`

---

## 4. Credit Card Rules

### CARD-001 (BR-006) — Available Credit Formula
**Status:** ✅ Verified — **differs from the commonly assumed formula**

```
Available Credit = Credit Limit − Outstanding Due − Unbilled
```

Note: this is **not** simply `Credit Limit − Outstanding`. Unbilled spend is also
deducted.

**Open product question:** most card issuers do reduce available credit as soon as a
purchase posts (even before it's billed), so this formula is plausible as *intended*
behavior, not just as *implemented* behavior. But that's an assumption about your
product intent, not something the code itself proves — decide and record the answer
here rather than treating either reading as default-correct.

**Source:** `src/lib/calculations.ts` (`creditCardAvailableLimit`)

### CARD-002 (BR-007) — Due Date vs Next Bill Date
**Status:** ✅ Verified

Believed: Due Date and Next Bill Date are independent fields, not derived from one
another. Confirmed: `updateCreditCard()` protects `nextDueDate` from accidental
overwrites when only `dueDate` is edited (see `src/hooks/useStore.tsx`). The two
fields are stored independently and are not implicitly derived.

### CARD-003 (BR-008) — Paying a Card
**Status:** ✅ Verified (clarified)

Clarification: there are two distinct payment flows:
- Quick-pay / "Mark as Paid" flow (`processUpcomingDuePayment`): clears `unbilled`,
  advances `nextDueDate` and updates `dueDate` for the card (intentional for the
  quick-pay flow used in Upcoming Dues).
- Normal transaction payments (`createTransaction` / `applyTransactionEffects`):
  reduce `outstanding` only and do not move `unbilled` → `outstanding` nor advance
  the billing cycle automatically.

The rule as originally stated is therefore true for the quick-pay flow and not a
universal property of *all* payment paths. See `src/hooks/useStore.tsx` and
`src/lib/transactionEffects.ts` for the two behaviors. Regression coverage exists
in `src/components/__tests__/MarkAsPaidFlow.test.tsx` and
`src/lib/__tests__/transactionEffects.test.ts`.

---

## 5. Loan Rules

### LOAN-001 (BR-009) — Remaining EMIs
**Status:** ✅ Verified

```
Remaining EMIs = max(0, emiCount − paidCount)
```

**Source:** `src/lib/loanCalculations.ts` (`getRemainingEmis`)

### LOAN-002 (BR-010) — Months Remaining Is Date-Derived, Not Counter-Derived
**Status:** ✅ Verified — **more precise than the assumed rule**

"Remaining Months" is **not** a stored counter that decrements on payment. It's computed
as `differenceInMonths(loanEndDate, now)`, where `loanEndDate` is derived from
`startDate + emiCount × frequency`. A missed or late payment does not change this value;
only the calendar date does.

**Source:** `src/lib/loanCalculations.ts` (`getMonthsRemaining`, `getLoanEndDate`)

### LOAN-003 (BR-011) — EMI Amount Stability
**Status:** ✅ Verified

There is no automatic recalculation path for `emiAmount` in the store logic. Changes
to other loan fields (e.g. interest rate) do not mutate `emiAmount` implicitly; the
value is only changed via explicit `updateLoan` calls. Regression test: `src/hooks/__tests__/loanEmiStable.test.ts`.
**Source:** `src/hooks/useStore.tsx` (`updateLoan`, `processUpcomingDuePayment`)

### LOAN-004 (BR-012) — paidCount Increment Path
**Status:** ✅ Verified

`paidCount` is mutated in `useStore.tsx` and `EditPage.tsx` (and advanced by the
quick-pay flow in `processUpcomingDuePayment`). Transaction side-effects (`createTransaction`/
`applyTransactionEffects`) do not edit `paidCount`. This is confirmed in the codebase.

**Architecture note:** this is not treated here as a bug. Loan payments currently
bypass the shared transaction-effects pipeline used by Lent and Borrow. That may be
intentional (loans don't need a matching Transaction record the way Lent/Borrow do),
but it should be a conscious decision, revisited if MoneyMind moves toward a unified
transaction engine. See `ARCHITECTURE.md`.

**Depends on:** LENT-002, BORROW-001 (for contrast — those *do* route through
`transactionEffects.ts`)

---

## 6. Category Rules

### CAT-001 (BR-013) — Category Registry Is Shared State
**Status:** ✅ Verified

Categories live as `categories: Category[]` on the root `Store` object (single source
of truth), not duplicated per-component. Registry is initialized/sorted via
`sortCategoriesForRegistry()` and `ensureCategoriesForTransactions()`.

**Source:** `src/hooks/useStore.tsx`

### CAT-002 (BR-014) — No Local Category Arrays in Components
**Status:** ✅ Verified

Component code generally consumes the shared category registry from `useStore`.
Searches across `src/components/` show no local static category registries used in
production code (test fixtures are allowed). The registry functions are the
single source of truth (`sortCategoriesForRegistry()`, `ensureCategoriesForTransactions()`).
**Source:** `src/hooks/useStore.tsx`

### CAT-003 — System Categories Cannot Be Deleted
**Status:** ✅ Corrected / Verified

Correction: the store-level code does **not** prevent system category deletion. The
helper `isSystemCategory()` exists to identify system categories, and the registry
logic preserves system categories at the top of the list, but deletion is handled
by the generic `deleteRecord()` behaviour (which simply marks `deleted: true`).
If product intent is to prevent deletion of system categories, the UI must enforce
that guard; the store does not enforce it today.
**Source:** `src/hooks/useStore.tsx` (`isSystemCategory`, `deleteRecord`)

### CAT-004 — No Duplicate Category Names Within a Transaction Type
**Status:** ✅ Verified

`sortCategoriesForRegistry()` normalizes names and deduplicates categories by name
within the same transaction type (case-insensitive). The add-category flow also
respects this when creating new categories via `addCustomCategory()`.

**Regression test:** `src/lib/__tests__/categoryRegistry.test.ts`
**Source:** `src/hooks/useStore.tsx` (`sortCategoriesForRegistry`, `addCustomCategory`)

### CAT-005 — Registry Preserves Insertion Order
**Status:** ✅ Corrected / Verified

Correction: insertion order is **not** preserved. System categories are sorted into
the default system order defined by `DEFAULT_MONEY_IN_CATEGORY_NAMES`, and custom
categories are ordered by their `createdAt` timestamp. The registry therefore does
not preserve raw insertion order for system categories.

**Source:** `src/hooks/useStore.tsx` (`sortCategoriesForRegistry`)

---

## 7. Archive Rules

### ARCH-001 (BR-015) — Archived Records Never Participate in Calculations
**Status:** ✅ Verified

All calculation filters check `!archivedAt` alongside `!deleted`.

**Depends on:** FIN-002 (same underlying filter logic)

---

## 8. Transaction Rules

### TXN-001 (BR-016) — Transactions Store Category Name, Not ID
**Status:** ✅ Verified

`Transaction.category` is a `string` and the normalization/creation flows store
the category name rather than an ID. This is enforced by `normalizeTransaction()`
and visible in `createTransaction()` behaviour.

**Regression test:** `src/lib/__tests__/transactionCategory.test.ts`
**Source:** `src/hooks/useStore.tsx`, `src/lib/transactionEffects.ts`

---

## 9. Refresh Behaviour

### REFRESH-001 (BR-017) — No Manual Refresh Required
**Status:** ✅ Verified, with caveat

All tabs read from a single React context (`StoreProvider` / `useStore()`), so any
mutation to the store object re-renders every subscribed component automatically. This
isn't a set of explicit "refresh Home / refresh Assets / ..." calls — it's a structural
property of using one reactive store. Functionally equivalent to the assumed rule, but
worth documenting *why* it's true so a future refactor (e.g. splitting the store) doesn't
silently break it.

**Source:** `src/hooks/useStore.tsx`

---

## 10. Date Rules

### DATE-001 (BR-018) — Display Format
**Status:** ✅ Verified

The app uses `formatAppDate()` implemented in `src/utils/dateFormatter.ts`, which
formats dates as `DD/MMM/YYYY` (via `toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })`).

**Regression test:** `src/utils/__tests__/dateFormatter.test.ts`
**Source:** `src/utils/dateFormatter.ts`, usages in multiple components.

### DATE-002 (BR-019) — No Manual Date Entry
**Status:** ✅ Corrected / Clarified

Correction: the UI uses a mix of native HTML5 `input[type="date"]` fields and
shared calendar picker components depending on context. Some edit screens (e.g.
`EditDialog.tsx`, `PaymentHistorySheet.tsx`) use `type="date"` inputs which rely
on the browser's native date picker. The assertion that *no* manual date entry
is possible is therefore incorrect. If strict prevention of free-text entry is
required cross-platform, replace native date inputs with the custom picker.

**Source:** `src/components/EditDialog.tsx`, `src/components/PaymentHistorySheet.tsx`.

---

## Change History

### Version 1.0 — 2026-07-03
Created for MoneyMind v3.0 stabilization, following a source-code-verification pass
(not written from assumption).

Major additions:
- Financial calculation rules (FIN)
- Lent rules (LENT)
- Borrow rules (BORROW)
- Credit card rules (CARD), including correction of the Available Credit formula
- Loan rules (LOAN), including correction of Remaining Months semantics and the
  loan-payment architecture note
- Category registry rules (CAT)
- Archive, transaction, refresh, and date rules
- Application invariants section

---

## How to Use This Document

- Every new feature or refactor touching financial logic must either satisfy an existing
  ✅ rule or update this file in the same PR.
- Before promoting a rule from ⚠️/🚧 to ✅, add its verifying test to the **Regression
  test** field and link the source file/function.
- If a rule is found to be false during verification, correct it here immediately —
  do not leave stale documentation in place.
