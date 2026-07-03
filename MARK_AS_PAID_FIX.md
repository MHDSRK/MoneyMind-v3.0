# Fix: Mark as Paid Action Not Working – Issue 02.X

## Summary
Fixed a critical UI bug in the "Mark as Paid" flow where tapping the action button did not show the payment options panel. The issue was caused by `SwipeableArchiveCard` forcibly closing itself when the action button was clicked, preventing the parent component from showing the follow-up payment UI.

## Root Cause
In [src/components/SwipeableArchiveCard.tsx](src/components/SwipeableArchiveCard.tsx), the `handleAction()` function was calling:
```typescript
onArchive();
setInternalIsOpen(false);        // ❌ Forced close
onOpenChange?.(false);            // ❌ Notified parent to close
```

This created a race condition:
1. User swipes to reveal "Mark as Paid" button
2. User taps "Mark as Paid"
3. `SwipeableArchiveCard` fires `onOpenChange(false)` → parent closes the row
4. Parent's state update conflicts with the row trying to stay open
5. Payment panel (`payOpenId` condition) never renders

## The Fix
Modified `handleAction()` to **only** call `onArchive()` and let the parent manage the open state:

```typescript
const handleAction = () => {
  // Invoke the archive/action handler but don't force-close the swipe here.
  // The parent controls `isOpen`/`onOpenChange` and may want to keep the
  // row open to present follow-up UI (e.g. payment options). Closing here
  // caused the parent to receive a conflicting state update and prevented
  // follow-up actions from appearing.
  onArchive();
};
```

**Why this works:**
- `HomeTab.tsx` controls the `isOpen` state via `openRowId`
- When "Mark as Paid" is clicked, it calls `setPayOpenId(due.id)` to show the payment form
- The row stays open, allowing the payment panel to render below it
- User can now select an account, enter an amount, and submit the payment

## Files Changed
- [src/components/SwipeableArchiveCard.tsx](src/components/SwipeableArchiveCard.tsx)
  - Removed forced close logic from `handleAction()`

## Tests Added

### 1. SwipeableArchiveCard Behavior Test
**File:** [src/components/__tests__/HomeTab.test.tsx](src/components/__tests__/HomeTab.test.tsx)

New test: `"Mark as Paid flow: action click does not force-close the swipe item"`

Verifies:
- Action button is clickable
- `onArchive()` callback fires
- Swipe container remains open (not forced-closed)
- No conflicting state updates

### 2. Integration Tests for Payment Processing
**File:** [src/components/__tests__/MarkAsPaidFlow.test.tsx](src/components/__tests__/MarkAsPaidFlow.test.tsx) (new)

Tests the complete "Mark as Paid" flow for:

#### Credit Card Payment
- ✅ Payment transaction created with correct ledger/category
- ✅ Account balance decreases
- ✅ Payment linked to correct card via `relatedEntityType` and `relatedEntityId`

#### Loan EMI Payment
- ✅ EMI transaction recorded
- ✅ `paidCount` incremented
- ✅ `outstanding` reduced
- ✅ `nextEmiDate` advanced by 1 month

#### Liability Payment (Borrow)
- ✅ Payment transaction created
- ✅ Borrow liability marked as deleted
- ✅ Account balance updated

#### Liability Payment (Regular Expenses)
- ✅ Payment transaction created
- ✅ Regular liability NOT deleted
- ✅ `dueDate` advanced by 1 month

#### Validation
- ✅ Insufficient balance check

## Expected User Experience After Fix
1. **Swipe**: User swipes left on an upcoming due item
2. **Reveal**: "Mark as Paid" button appears
3. **Click**: User taps the button
4. **Panel Opens**: ✅ Payment options appear below the swiped item (previously broken)
5. **Fill**: User selects source account and enters/confirms amount
6. **Pay**: User taps "Pay ₹XXX"
7. **Record**: Payment transaction is recorded
8. **Update**: 
   - Account balance decreases
   - Card/Loan/Liability state updates
   - Due item disappears from Upcoming Dues (if fully paid)
   - Home Dashboard, Cards tab, Loans tab, Reports, History all refresh

## Verification Steps

### Manual Testing
1. Open the app and navigate to **Home > Upcoming Dues**
2. Ensure you have at least one upcoming due (credit card, loan, or liability)
3. **Swipe left** on the due item to reveal "Mark as Paid"
4. **Tap "Mark as Paid"** button
5. ✅ A payment form should appear below the item with:
   - "Select Account" dropdown
   - Account selection
   - "Pay ₹XXX" button
6. Select an account with sufficient balance
7. Tap the pay button
8. Verify:
   - Payment is recorded in transaction history
   - Due item disappears or updates in Upcoming Dues
   - Account balance decreases
   - No manual refresh needed

### Automated Testing
```bash
npm test -- MarkAsPaidFlow.test.tsx --run
npm test -- HomeTab.test.tsx --run
npm test -- --run  # Full suite
```

## Build Status
✅ **TypeScript compilation**: No errors  
✅ **Build output**: Successfully produced (dist/ folder)  
✅ **CSS/JS assets**: Generated correctly

## Related Code
- `HomeTab.tsx` – Manages upcoming dues list and payment form visibility
- `SwipeableArchiveCard.tsx` – Swipe gesture and action button (FIXED)
- `useStore.tsx` → `processUpcomingDuePayment()` – Processes the payment
- `transactionEffects.ts` → `createTransaction()` – Creates payment transaction
- `calculations.ts` → `getUpcomingDues()` – Filters and sorts upcoming dues

## Notes
- The fix is **minimal and non-breaking**: only affects the action button behavior
- All existing functionality preserved: swipe gesture, visual feedback, animations
- Parent component now has full control over row open/close state
- Compatible with other SwipeableArchiveCard uses (future archive/delete actions)
