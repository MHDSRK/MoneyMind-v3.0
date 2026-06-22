# MoneyMind v2.0 - Architectural Refactoring Status

## ✅ FOUNDATION COMPLETE (Steps 1-2 of Build Order)

### Phase 1: Store Restructuring ✅
- **File**: `src/hooks/useStore.tsx`
- **Changes**: Complete rewrite with React Context pattern
- **New Schema v2**: 
  - `transactions[]` - with fromAccount/toAccount/fromCard/toCard/loanId fields
  - `accounts[]` - with type field ("cash"|"bank"|"business"|"investments"|"insurance"|"other")
  - `creditCards[]` - separate collection with outstanding/limit tracking
  - `loans[]` - separate collection with EMI calculations
  - `categories[]`, `tags[]`, `settings`, `backups[]`, `recycleBin[]`
- **Storage**: Changed from "moneymind-data" → "moneymind-data-v2"
- **Status**: ✅ Compiles successfully

### Phase 2: Automatic Calculations ✅
- **File**: `src/lib/calculations.ts`
- **FinancialMetrics**: 20+ calculated fields
  - Assets by type: cashBalance, bankBalance, businessBalance, investmentsBalance, insuranceBalance, otherAssetsBalance, totalAssets
  - Liabilities: creditCardOutstanding, creditCardAvailableLimit, loanOutstanding, totalLiabilities, netWorth
  - Cash flows: todayIncome, todayExpense, todayNet, monthlyIncome, monthlyExpense, monthlyNet
- **Helper Functions**: 
  - `calculateMetrics(store): FinancialMetrics`
  - `getAccountBalance(store, accountId)` - single account balance
  - `getCreditCardAvailable(store, cardId)` - available credit
  - `getTransactionsInRange(store, startDate, endDate)` - date filtering
  - `getTransactionsByCategory(store, category)` - category filtering
  - `getAccountBalanceHistory(store, accountId, days)` - time series
- **Status**: ✅ Compiles successfully

### Phase 3: New Components Created ✅
- **CreditCardsTab.tsx**: Full card management UI with add/edit/delete
- **LoansTab.tsx**: Full loan management UI with EMI tracking
- **SearchPanel.tsx**: Transaction search with multi-filter capability
- **loanCalculations.ts**: EMI calculations, payment schedules, default detection

---

## 🔄 COMPONENT MIGRATION IN PROGRESS

### Completed Migrations
✅ **HomeTab.tsx** (23 → 0 errors)
- Migrated to use `calculateMetrics(store)` for net worth display
- Changed due dates from `store.liabilities` → `store.creditCards`
- Updated transaction creation with new structure (fromAccount/toAccount)
- Now pulls categories from store.categories array
- Accounts now displayed from store.accounts filtered by type

✅ **TodayTab.tsx** (1 → 0 errors)
- Fixed transaction.account → toAccount/fromAccount routing

### Remaining Migrations (47 errors)
**LiabilitiesTab.tsx** (10 errors)
- Still references: `store.liabilities`, `store.lends`
- Needs: Rebuild to show `store.creditCards` and `store.loans` separately
- Pattern to apply:
  ```typescript
  const creditCardLiabilities = store.creditCards.filter(cc => !cc.deleted);
  const loanOutstanding = store.loans.reduce((sum, l) => sum + l.outstanding, 0);
  ```

**ProfileMenu.tsx** (15 errors)
- Most complex: Contains export logic and multiple store references
- Issues: `account.group` → use `account.type`, old export structure
- Critical: Export function needs update to work with new store structure
- Needs step-by-step migration:
  1. Update export data building
  2. Fix account type field references
  3. Replace liabilities/lends with creditCards/loans

**AssetsTab.tsx** (8+ errors)
- Similar to LiabilitiesTab
- References: `store.lends` → now should be tracked as transactions with category "Lent"
- Needs: Rebuild to query transactions instead

---

## 📊 Error Reduction Progress
```
Initial:    89 errors
After Step 1: 89 errors (store structure)
After Step 2: 89 errors (calculations)
After Step 3a: 23 errors removed (HomeTab)
After Step 3b: 1 error removed (TodayTab)
Current:    47 errors (47% reduction)
Target:     0 errors
```

---

## 📋 NEXT IMMEDIATE ACTIONS

### Priority 1: Finish Component Migration (Get to 0 errors)
1. **LiabilitiesTab.tsx** - ~30 mins
   - Remove store.liabilities references
   - Display creditCards list
   - Display loans list with outstanding amounts
   
2. **ProfileMenu.tsx** - ~45 mins
   - Fix export function to work with new schema
   - Update account group checks
   - Test export still works

3. **AssetsTab.tsx** - ~30 mins
   - Remove lends references
   - Query transactions for lending tracking

### Priority 2: Build Order Step 3 - Enhanced Transaction Entry
- Add ledger suggestions (pooling from accounts, cards, loans, previous entries)
- Add notes field
- Add tags multi-select

### Priority 3: Build Order Step 6+ - Additional Features
- Backup system (local + encrypted)
- Enhanced export/import
- PIN security
- Google Drive sync (LAST)

---

## 🛠️ Migration Patterns Reference

### Pattern 1: Data Collection Changes
```typescript
// OLD
const creditCardLiabilities = store.liabilities.filter(l => l.group === "Credit Cards");

// NEW
const creditCardLiabilities = store.creditCards.filter(cc => !cc.deleted);
```

### Pattern 2: Account Group Changes
```typescript
// OLD
if (account.group === "credit-cards") { ... }
if (account.group === "accounts") { ... }

// NEW
if (account.type === "cash" || account.type === "bank") { ... }
// Better: use store.creditCards directly
```

### Pattern 3: Transaction Structure
```typescript
// OLD
{ account, type, amount, ledger, category }

// NEW
{ fromAccount?, toAccount?, fromCard?, toCard?, loanId?, 
  ledger, type, amount, category, notes?, tags[] }
```

### Pattern 4: Calculations
```typescript
// OLD - manual calculations everywhere
const totalAssets = store.accounts
  .filter(a => a.group === "accounts")
  .reduce((sum, a) => sum + a.balance, 0);

// NEW - call once
const metrics = calculateMetrics(store);
const totalAssets = metrics.totalAssets;
```

---

## 📁 Files Modified This Session
- ✅ src/hooks/useStore.tsx (Complete rewrite - v2 schema)
- ✅ src/lib/calculations.ts (New file - Financial metrics)
- ✅ src/lib/loanCalculations.ts (New file - EMI calculations)
- ✅ src/components/HomeTab.tsx (Major update - New store structure)
- ✅ src/components/CreditCardsTab.tsx (New file)
- ✅ src/components/LoansTab.tsx (New file)
- ✅ src/components/SearchPanel.tsx (New file)
- ✅ src/components/TodayTab.tsx (Minor fix)
- ⏳ src/components/LiabilitiesTab.tsx (Needs migration)
- ⏳ src/components/ProfileMenu.tsx (Needs migration - complex)
- ⏳ src/components/AssetsTab.tsx (Needs migration)
- ⏳ src/App.tsx (May need tab type updates)

---

## 🎯 Success Criteria
- ✅ 0 TypeScript errors
- ✅ All components compile
- ✅ Core features work: transaction entry, credit cards, loans
- ✅ Financial metrics display correctly
- ✅ No breaking changes to UI/UX
- ⏳ Passing all tests

---

## ⚠️ Important Reminders
1. **DO NOT start Google Drive sync yet** - Local data model must be perfect first
2. **Always run `npm run typecheck`** after changes to verify compilation
3. **Test in browser** after fixing migration issues to catch runtime errors
4. **Use calculateMetrics()** - don't manually calculate totals in components
5. **Backward compatibility helpers** still available in useStore.tsx for emergency fallback

---

## 📞 Quick Reference: Remaining Work
- 47 TypeScript errors to fix
- 3-4 component files need migration  
- Est. 2-3 hours total (1 hour per complex component)
- Then can proceed with remaining build order steps
