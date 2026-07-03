# MoneyMind v3.0 - Personal Finance Dashboard

MoneyMind is a personal finance PWA built with React, TypeScript, Vite, and Tailwind CSS. It is designed for personal use: track accounts, credit cards, loans, liabilities, transactions, cash flow, exports, and local backups.

## Features

### Core Finance

- Dashboard with net worth, daily totals, and quick transaction entry
- Today view for daily income, expenses, and transfers
- Accounts, credit cards, loans, liabilities, and lent-money tracking
- Category-based transaction organization
- Cash-flow reporting and date filters

### Backup And Export

- Manual local backups
- Optional daily local auto-backups
- Restore from local backup snapshots
- Import and export backup JSON files
- Export financial data to Excel

Cloud sync is hidden for now. The supported personal-use backup flow is local backup plus downloaded backup files.

### PWA Support

- Web app manifest for install prompts
- Service worker for app-shell caching and offline navigation fallback
- Mobile-friendly layout
- Dark theme

## Quick Start

```bash
pnpm install
pnpm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
pnpm run build
pnpm run preview
```

## Testing

```bash
pnpm run typecheck
pnpm run test:ci
```

## Personal Data Notes

- Data is stored in browser localStorage.
- Local backups are stored in the same browser profile.
- Download backup files regularly if you want copies outside the browser.
- Clearing browser site data will remove app data and local backups.

## Project Scripts

- `pnpm run dev` - start the development server
- `pnpm run build` - type-check and build the production app
- `pnpm run preview` - preview the production build
- `pnpm run test:ci` - run the test suite once
- `pnpm run test:coverage` - run tests with coverage

## Version

Current version: 3.0.0
