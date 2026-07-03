# MoneyMind — Architecture

**Applies to:** MoneyMind v3.x
**Status:** Living Document
**Last Reviewed:** 2026-07-03

Describes how the app is built. For *what* the financial logic must do, see
`BUSINESS_RULES.md`.

## Stack

- React 18 + TypeScript, built with Vite.
- Routing: `wouter`.
- UI: shadcn/ui components generated on top of Radix UI primitives, styled with
  Tailwind CSS v4.
- State: single React Context (`StoreProvider` in `src/hooks/useStore.tsx`) — no Redux
  or external state library.
- Persistence: browser `localStorage`, one JSON blob under a single store key.
- Testing: Vitest + Testing Library.

## State Management

`src/hooks/useStore.tsx` owns the entire application state as one `Store` object:

```
Store {
  accounts, creditCards, loans, liabilities, transactions, categories, ...
}
```

- `loadStore()` reads and validates `localStorage` on init; falls back to
  `INITIAL_DATA` on missing/corrupt data (wrapped in try/catch).
- A `useEffect` persists the store to `localStorage` on every change.
- All tabs/components consume state via the same context, so any mutation
  re-renders every subscriber — there is no manual "refresh" step per screen
  (see BR-017).

**Architectural note:** this means the entire app re-renders on most state changes.
Fine at current data volumes; worth revisiting with `useMemo`/context-splitting if the
transaction list grows large.

## Calculation Engine

Business math lives in `src/lib/`, not in components:

- `calculations.ts` — net worth, assets, liabilities, credit card metrics, cash flow
  summary. This is the single place dashboard totals are derived.
- `loanCalculations.ts` — EMI/remaining-months/interest math for loans.
- `transactionEffects.ts` — side-effects of posting a transaction (Lent/Borrow
  create/reduce logic, account/card balance touches).
- `cashFlow.ts` — cash flow tab aggregation.
- `paymentHistory.ts`, `notifications.ts`, `search.ts`, `exportService.ts` — supporting
  concerns.

Components should call into these modules rather than reimplementing math inline —
duplicated calculation logic is the main risk this separation guards against.

## Category Registry

`categories: Category[]` lives on the root `Store`, not per-component. Initialized and
sorted through `sortCategoriesForRegistry()` / `ensureCategoriesForTransactions()` in
`useStore.tsx`. Intended as single source of truth (BR-013); component-level duplication
has not been fully audited (BR-014).

## Persistence & Backup

- Primary persistence: `localStorage`, plain JSON, unencrypted (see Security section).
- `backupService.ts` — local backup/auto-backup logic, also reads/writes
  `localStorage`.
- `googleDriveService.ts` — Google Drive backup/restore integration.
- `exportService.ts` — data export (e.g. XLSX via the `xlsx` package).

## Component Structure

- `src/components/*Tab.tsx` — top-level screens (Home, Assets, Liabilities, Credit
  Cards, Loans, Cash Flow, History, Archived).
- `src/components/ui/*` — shadcn-generated primitives wrapping Radix UI. **Do not
  hand-edit generated wrapper behavior without checking Radix version compatibility**
  (see known build issue below).
- `src/components/common/`, `src/components/profile/` — shared/cross-cutting UI.
- `EditPage.tsx` / `EditDialog.tsx` / `EditAccordion.tsx` — shared editing surfaces used
  across multiple record types.

## PWA Status

`public/manifest.json` + icons are present and linked from `index.html`. **No service
worker is currently registered anywhere in the codebase.** This means:

- No offline support.
- No asset caching / update lifecycle.
- Installability is partial (manifest-only), not a full PWA.

This is tracked as a High Priority item, not yet implemented.

## Known Build-Time Risk

`package.json` pins Radix UI packages with `^` ranges. The shadcn-generated components
in `src/components/ui/` were generated against a specific Radix API shape; a newer
installed Radix version can break their prop typing (`className`/`children` no longer
recognized), which breaks `tsc --noEmit` and therefore `pnpm build`. See
`CONTRIBUTING.md` for the required check before merging any dependency bump.

## Testing Strategy

- **Unit tests** (`src/lib/__tests__/`) — cover pure calculation logic:
  `calculations.ts`, `calculations.lent.test.ts`, `loanCalculations.ts`. This is where
  every `BUSINESS_RULES.md` rule promoted to ✅ Verified should have (or gain) a
  corresponding test.
- **Component tests** (`src/components/*.test.tsx`, `src/components/__tests__/`) —
  cover individual screens: Credit Cards, Loans, Assets, Home, Edit Page, dialog
  accessibility.
- **End-to-end / integration tests** (`src/__tests__/app.e2e.test.tsx`,
  `vitest-e2e.json`) — cover cross-cutting flows.
- **Regression tests** — any change to a financial calculation must add or update a
  test in `src/lib/__tests__/`, per `CONTRIBUTING.md`.

Test suite status as of this review: **unverified** against a clean install (see
`BUSINESS_RULES.md` context and prior review) — the shipped `node_modules` had a
broken `@vitest/utils` resolution. Run `pnpm install && pnpm test` fresh before
trusting current pass/fail state.

## Security Model (current)

- All data, including financial records, stored unencrypted in `localStorage`.
- No authentication — this is a local-only, single-user app today.
- Google Drive integration exists for backup but does not change the local trust model.
- If cloud sync / multi-user / auth is added later, this section and the local storage
  encryption question in `BUSINESS_RULES.md` must be revisited together — the security
  model changes materially at that point.
