# Contributing to MoneyMind

**Applies to:** MoneyMind v3.x
**Status:** Living Document
**Last Reviewed:** 2026-07-03

## Before every commit

Run all three, in order. Do not commit if any fail:

```bash
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` runs `tsc --noEmit && vite build` — a red typecheck means the app cannot
ship, regardless of whether the dev server happens to run.

## Before a clean environment / dependency change

```bash
rm -rf node_modules
rm -f pnpm-lock.yaml   # only if intentionally regenerating dependencies
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Required whenever `package.json` dependency ranges change — especially Radix UI /
shadcn packages, which have previously broken the build on a minor-version bump (see
`ARCHITECTURE.md`, "Known Build-Time Risk").

## Business logic changes

- Do not modify financial calculation logic without first checking
  `BUSINESS_RULES.md`.
- If your change affects an existing rule, update its status and affected-files list
  in the same PR.
- If your change introduces new financial behavior, add a new `BR-XXX` entry — even
  as ⚠️ Pending Verification — rather than leaving it undocumented.
- Any change to `src/lib/calculations.ts`, `transactionEffects.ts`, or
  `loanCalculations.ts` requires a regression test in `src/lib/__tests__/`.

## Code conventions

- No duplicated calculation logic in components — call into `src/lib/*` instead.
- No local/per-component category arrays — use the shared `categories` registry on
  the store (see BR-013/BR-014).
- Avoid introducing new `any` types. Use the concrete type where it's knowable. If it
  genuinely isn't, use `unknown` and narrow explicitly at the point of use — don't
  suppress the type error with `any` just to move on.
- No `console.log` left in committed code. Use `if (import.meta.env.DEV) console.log(...)`
  if logging is needed for local debugging, and prefer removing it before merge.
- Prefer shared utilities/components over copy-pasted implementations, particularly for
  date pickers, dialogs, and swipe interactions.

## Financial safety rules

- Never duplicate calculation logic — every financial calculation must originate from
  `src/lib/`, not be re-implemented inline in a component.
- Never calculate financial totals inside UI components.
- Never bypass the shared calculation engine (`calculations.ts`, `loanCalculations.ts`,
  `transactionEffects.ts`) to "quickly" compute a number for display.
- Never silently modify financial records — any automatic update (e.g. an EMI
  advancing a due date) must be traceable and must preserve the invariants listed in
  `BUSINESS_RULES.md`.

## Data integrity rules

- Never mutate archived records.
- Never include archived or deleted records in calculations.
- Prefer archive over hard delete for financial records.
- Preserve transaction history whenever possible; don't silently drop it during
  edits/migrations.

## Shared components

Prefer the existing shared implementations over a new one-off:
- Date picker
- Dialog / Alert Dialog
- Accordion
- Swipe actions (`SwipeableListItem`, `SwipeableArchiveCard`)
- Summary/record cards

Don't duplicate a UI pattern across screens because it's faster than reusing the
existing component — that's exactly the kind of drift that turns into inconsistent
mobile UX later.

## Build blockers

The following always block merge, no exceptions:
- TypeScript errors
- Failing tests
- Build failures (`pnpm build`)
- Broken lint rules (once linting is configured — not currently present in this repo,
  worth adding)

## Pull request checklist

- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] No new `any`, no stray `console.log`
- [ ] `BUSINESS_RULES.md` updated if financial logic changed
- [ ] Regression test added/updated for any changed calculation
- [ ] No local category list duplication introduced
- [ ] If any part of this PR was AI-generated: it has been read, typechecked, tested,
      built, and checked against `BUSINESS_RULES.md` — not merged as-generated

## Release checklist

Before tagging a release (e.g. `v3.0.0`):

- [ ] `pnpm install` completes cleanly on a fresh clone
- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm test` passes (verified after clean install, not just locally)
- [ ] `pnpm build` succeeds
- [ ] All business-logic regression tests pass (Lent, Borrow, Credit Cards, Loans,
      Assets, Upcoming Dues)
- [ ] Mobile UX verified on Android Chrome and iPhone Safari
- [ ] PWA functionality complete and tested (service worker, offline, install)
- [ ] Google Drive backup/restore verified end-to-end
- [ ] No remaining `console.log`, stray `any`, or repository artifacts
      (`dist/`, `test-output.txt`, etc.)
- [ ] `BUSINESS_RULES.md` and `ARCHITECTURE.md` reflect the current codebase
- [ ] No rule was silently left "Pending Verification" that should have been resolved
      by this release's changes
