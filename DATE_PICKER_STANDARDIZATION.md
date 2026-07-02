# Issue 33: Standardized Date Picker Implementation

## Overview
MoneyMind now uses a **single, unified date picker implementation** for all editable date fields. This ensures consistent behavior across desktop, iOS, and Android platforms.

## The Standardized Date Picker

### Primary Component
**File:** `src/components/EditDialog.tsx`

**Type:** Native HTML5 `<input type="date">` with browser's built-in calendar picker

**Implementation:**
```jsx
<input
  type="date"
  value={draft}
  readOnly={true}          // Forces calendar picker only
  onFocus={() => showPicker()} // Opens calendar immediately
  onPaste={(e) => e.preventDefault()} // Prevents manual entry
/>
```

## Date Fields Using This Implementation

### Credit Cards
- **Due Date** - Day of month for billing cycle
- **Next Bill Date** - When the next bill will be generated

### Loans
- **Next EMI Date** - When the next EMI payment is due

### Liabilities (All Groups)
- **Regular Expenses: Due Date**
- **Chitty: Due Date**
- **Borrow: Due Date**
- **More Liabilities: Due Date**

## Implementation Flow

### 1. **Field Type Detection** (`getDialogInputType` in EditPage.tsx)
```javascript
if (field === 'Next Bill Date' || field === 'Next EMI') return 'date';
if (field === 'Due Date' && entity?.type === 'liability') return 'date';
if (field === 'Due Date' && entity?.type === 'credit-card') return 'date';
```

### 2. **Value Normalization** (`normalizeDialogValue` in EditPage.tsx)
Converts all date formats to consistent YYYY-MM-DD format:
```javascript
if (isDateField && currentValue) {
  const datePart = currentValue.split('T')[0];
  return datePart;
}
```

Handles both:
- ISO format with time: `2026-07-02T00:00:00.000Z` → `2026-07-02`
- Date-only format: `2026-07-02` → `2026-07-02`

### 3. **Date Picker Interaction** (EditDialog.tsx)
```javascript
// On focus: Open calendar picker
event.currentTarget.showPicker?.();

// On key press:
// - Enter: Save and close
// - Tab/Escape: Allowed (don't prevent)
// - Any other key: Prevent (no manual entry)

// On paste: Prevent
```

### 4. **Display Format** (formatDisplayDate in utils/date.ts)
All dates displayed as: `DD/MMM/YYYY` (e.g., "02/Jul/2026")

### 5. **Storage Format**
- **Credit Card Due Date**: `YYYY-MM-DD` (e.g., "2026-07-02")
- **Credit Card Next Bill Date**: ISO format (e.g., "2026-07-02T00:00:00.000Z")
- **Loan Next EMI Date**: `YYYY-MM-DD` (e.g., "2026-07-02")
- **Liability Due Date**: `YYYY-MM-DD` (e.g., "2026-07-02")

## Platform Support

### Desktop Browsers
- **Chrome/Edge**: Native calendar picker
- **Firefox**: Native calendar picker
- **Safari**: Native calendar picker

### Mobile
- **iOS**: Native iOS date wheel picker
- **Android**: Native Android date picker

All provide consistent, native user experience.

## Key Features

✅ **Single Implementation** - No duplicate date picker code
✅ **Consistent UI** - Same picker for all date fields
✅ **Mobile-Friendly** - Works perfectly on iOS and Android
✅ **No Manual Entry** - ReadOnly enforces calendar selection
✅ **Automatic Normalization** - Handles different date formats transparently
✅ **Auto-Refresh** - Views refresh automatically after date changes
✅ **Accessible** - Uses standard HTML5 date input
✅ **No External Dependencies** - No additional date libraries needed

## Validation

All date fields:
- Cannot be edited manually (calendar picker only)
- Must be valid dates
- Are automatically saved when selected
- Trigger automatic refresh of affected views:
  - Home
  - Credit Cards
  - Loans
  - Liabilities
  - Edit Center
  - Upcoming Dues
  - History

## Future Date Fields

Any future editable date field should:

1. **Add field to `getDialogInputType()`** in EditPage.tsx:
```javascript
if (field === 'Your New Date Field') return 'date';
```

2. **Add to `normalizeDialogValue()`** if needed:
```javascript
const isDateField = (
  // ... existing fields ...
  field === 'Your New Date Field'
);
```

3. **Open the field with `openEditDialog()`**:
```javascript
openEditDialog(entity, 'Your New Date Field', value, 'Edit description')
```

That's it! The rest is handled automatically by the standardized implementation.

## Benefits

### Code Maintenance
- Single date picker component to maintain
- Consistent logic across all date fields
- Reduced code duplication
- Easier to fix bugs affecting all date fields

### User Experience
- Identical date picker behavior everywhere
- No confusion from different pickers
- Fast, familiar interface on every platform
- Accessible calendar picker on mobile

### Reliability
- All date fields tested the same way
- Consistent behavior across platforms
- No edge cases with multiple implementations
- Easier to support and debug

## Technical Details

### Date Input Attributes
```jsx
<input
  type="date"              // HTML5 date type
  readOnly={true}          // Prevents keyboard input
  value="2026-07-02"       // YYYY-MM-DD format required
  onFocus={showPicker}     // Opens calendar immediately
  onPaste={preventDefault} // Blocks paste operations
/>
```

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge): ✅ Full support
- iOS Safari: ✅ Full support with native wheel picker
- Android Chrome: ✅ Full support with native picker
- Older browsers: Falls back to text input (graceful degradation)

## References

- [MDN: HTML input type="date"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [Can I Use: input type="date"](https://caniuse.com/input-date)
- [showPicker() API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker)

## Testing Checklist

- [x] Due Date picker works on desktop
- [x] Due Date picker works on iOS
- [x] Due Date picker works on Android
- [x] Next Bill Date picker works on desktop
- [x] Next Bill Date picker works on iOS
- [x] Next Bill Date picker works on Android
- [x] Next EMI picker works on all platforms
- [x] No manual text entry possible
- [x] Auto-refresh works after date change
- [x] Date format is consistent (DD/MMM/YYYY)
- [x] No duplicate implementations remain
