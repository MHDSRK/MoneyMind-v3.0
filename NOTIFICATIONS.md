# Centralized Notification System

## Overview

The notification system provides a consistent approach to displaying success messages, warnings, validation errors, and unexpected failures throughout the MoneyMind app.

## Basic Usage

### Success Messages

```typescript
import { notifySuccess, successMessages } from "@/lib/notifications";

// Quick notification
notifySuccess("Changes saved");

// With description
notifySuccess({
  title: "Account Created",
  description: "New bank account has been added to your profile",
});

// Common success scenarios
successMessages.saved();
successMessages.created("Account");
successMessages.updated("Credit Card");
successMessages.deleted("Transaction");
successMessages.backedUp();
successMessages.restored();
```

### Error Messages

```typescript
import { notifyError, errorMessages } from "@/lib/notifications";

// Quick error
notifyError("Something went wrong");

// With description
notifyError({
  title: "Validation Error",
  description: "Credit limit must be greater than 0",
});

// Common error scenarios
errorMessages.validation("credit_limit");
errorMessages.required("Email");
errorMessages.insufficientBalance();
errorMessages.duplicate("Account");
errorMessages.failed("save your changes");
```

### Warning Messages

```typescript
import { notifyWarning, warningMessages } from "@/lib/notifications";

warningMessages.unsavedChanges();
warningMessages.lowBalance(500);
warningMessages.expiring("Credit Card", 7);
```

### Info Messages

```typescript
import { notifyInfo, infoMessages } from "@/lib/notifications";

infoMessages.loading();
infoMessages.processing();
infoMessages.syncing();
infoMessages.noTransactions();
```

## Validation

### Single Field Validation

```typescript
import { validateAndNotify } from "@/lib/notifications";

if (!validateAndNotify(amount > 0, "Amount must be greater than 0")) {
  return; // Validation failed, user was notified
}

// Validation passed, continue
```

### Batch Validation

```typescript
import { batchValidate } from "@/lib/notifications";

const isValid = batchValidate([
  {
    condition: name.trim().length > 0,
    error: "Name is required",
  },
  {
    condition: amount > 0,
    error: "Amount must be positive",
  },
  {
    condition: selectedAccount,
    error: { title: "No Account", description: "Please select an account" },
  },
]);

if (!isValid) return; // User was notified of first error
```

## Async Operations with Error Handling

```typescript
import { withErrorHandling } from "@/lib/notifications";

// With success message
const result = await withErrorHandling(
  async () => {
    const response = await fetch("/api/save");
    return response.json();
  },
  {
    successMessage: "Data saved successfully",
    errorTitle: "Failed to save",
    onError: (error) => console.error("Save failed:", error),
  }
);

if (result) {
  // Success, result contains data
}
```

## Integration Examples

### In Components

```typescript
import { notifySuccess, errorMessages, validateAndNotify } from "@/lib/notifications";

function handleSave(data) {
  if (!validateAndNotify(data.balance >= 0, "Balance cannot be negative")) {
    return;
  }

  updateStore(prev => ({
    ...prev,
    accounts: [...prev.accounts, data],
  }));

  notifySuccess("Account created successfully");
}
```

### In Form Submissions

```typescript
async function handleSubmit(formData) {
  const { name, amount, type } = formData;

  // Validate
  if (!batchValidate([
    { condition: name.trim(), error: "Name required" },
    { condition: amount > 0, error: "Amount must be positive" },
    { condition: type, error: "Type required" },
  ])) {
    return;
  }

  // Submit with automatic error handling
  const result = await withErrorHandling(
    () => api.createAccount(formData),
    { successMessage: "Account created!" }
  );

  if (result) {
    // Handle success
  }
}
```

### In Async Operations

```typescript
function handleBackup() {
  withErrorHandling(
    () => backupService.createBackup(),
    {
      successMessage: "Backup created successfully",
      errorTitle: "Backup failed",
    }
  );
}
```

## Message Categories

### Success Messages
- `saved()` - Generic save operation
- `created(type)` - Item created
- `updated(type)` - Item updated
- `deleted(type)` - Item deleted
- `exported()` - Data export
- `imported()` - Data import
- `backedUp()` - Backup created
- `restored()` - Backup restored
- `downloaded()` - File download
- `uploaded()` - File upload

### Error Messages
- `validation(field)` - Validation error on field
- `required(field)` - Required field missing
- `invalidFormat(field)` - Invalid format
- `minValue(field, min)` - Below minimum
- `maxValue(field, max)` - Exceeds maximum
- `insufficientBalance()` - Not enough balance
- `duplicate(type)` - Already exists
- `notFound(type)` - Item not found
- `failed(action)` - Operation failed
- `unexpected()` - Unknown error

### Warning Messages
- `unsavedChanges()` - Unsaved data
- `noData()` - No data to display
- `largeFile()` - File size warning
- `lowBalance(amount)` - Low account balance
- `expiring(type, days)` - Expiration soon

### Info Messages
- `loading()` - Loading data
- `processing()` - Processing operation
- `syncing()` - Data synchronization
- `checkingConnection()` - Connection check
- `noTransactions()` - No transactions
- `emptyList(type)` - Empty list

## Best Practices

1. **Use predefined messages** - Prefer `successMessages.saved()` over `notifySuccess("Saved")`
2. **Be specific** - Provide context in descriptions when needed
3. **Validate early** - Use `validateAndNotify` at input boundaries
4. **Batch validation** - Group related validations with `batchValidate`
5. **Consistent tone** - Keep messages friendly and clear
6. **Technical details** - Include error messages from APIs but simplify for users
7. **No alert spam** - Only show one notification at a time per the current toast limit

## Current Toast Configuration

- **Limit**: 1 toast at a time
- **Auto-dismiss**: After 1000 seconds (manual dismiss always available)
- **Position**: Top-right corner (via Toaster component)

To change these settings, update `src/hooks/use-toast.ts`:
```typescript
const TOAST_LIMIT = 1 // Change to show multiple toasts
const TOAST_REMOVE_DELAY = 1000000 // Auto-dismiss delay in ms
```
