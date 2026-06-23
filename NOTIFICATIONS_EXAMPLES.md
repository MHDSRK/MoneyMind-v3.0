/**
 * EXAMPLE INTEGRATION GUIDE
 * 
 * This file demonstrates how to integrate the centralized notification
 * system into existing MoneyMind components.
 * 
 * DELETE THIS FILE AFTER REVIEWING - it's for reference only.
 */

// ============================================================================
// EXAMPLE 1: Form Validation in AssetsTab
// ============================================================================

// OLD: No validation
function handleAddAccount_Old() {
  // Just add without checking
}

// NEW: With centralized notifications
import { validateAndNotify, successMessages } from "@/lib/notifications";

function handleAddAccount_New(accountData: { name: string; balance: number }) {
  // Validate
  if (!validateAndNotify(accountData.name.trim(), "Account name is required")) {
    return;
  }

  if (!validateAndNotify(accountData.balance >= 0, "Balance cannot be negative")) {
    return;
  }

  // Create account
  updateStore(prev => ({
    ...prev,
    accounts: [...prev.accounts, accountData],
  }));

  // Notify success
  successMessages.created("Account");
}

// ============================================================================
// EXAMPLE 2: Async Backup Operation in ProfileMenu
// ============================================================================

import { withErrorHandling } from "@/lib/notifications";

async function handleBackup_Old() {
  try {
    await backupService.createBackup();
    // No notification
  } catch (error) {
    console.error(error);
    // No user-facing error message
  }
}

async function handleBackup_New() {
  await withErrorHandling(
    () => backupService.createBackup(),
    {
      successMessage: "Backup created successfully",
      errorTitle: "Failed to create backup",
    }
  );
}

// ============================================================================
// EXAMPLE 3: Batch Validation in Form
// ============================================================================

import { batchValidate } from "@/lib/notifications";

function handleTransactionSubmit_New(formData: {
  amount: number;
  category: string;
  account: string;
}) {
  const isValid = batchValidate([
    {
      condition: formData.amount > 0,
      error: "Amount must be greater than zero",
    },
    {
      condition: formData.category.length > 0,
      error: "Please select a category",
    },
    {
      condition: formData.account.length > 0,
      error: "Please select an account",
    },
  ]);

  if (!isValid) return; // User already notified of first error

  // Process transaction
  saveTransaction(formData);
  successMessages.created("Transaction");
}

// ============================================================================
// EXAMPLE 4: Handling Different Error Types
// ============================================================================

import { 
  notifyError, 
  notifyWarning, 
  errorMessages,
  warningMessages 
} from "@/lib/notifications";

async function handleCreditCardUpdate_New(cardData: any) {
  // Validate business logic
  if (cardData.creditLimit < cardData.outstanding) {
    errorMessages.insufficientBalance(); // Better error name for context
    return;
  }

  if (cardData.dueDate < new Date()) {
    warningMessages.expiring("Credit Card", 0);
    return;
  }

  // Try update
  const result = await withErrorHandling(
    () => updateCreditCard(cardData),
    { successMessage: "Credit card updated" }
  );
}

// ============================================================================
// EXAMPLE 5: Using Validation Helper in UI
// ============================================================================

function EditLoanModal_New() {
  const handleSave = () => {
    // Validate before submission
    if (!validateAndNotify(loanName.trim(), errorMessages.required("Loan Name"))) {
      return;
    }

    if (!validateAndNotify(principalAmount > 0, "Principal must be positive")) {
      return;
    }

    // Save
    updateStore(...);
    successMessages.updated("Loan");
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
      {/* form fields */}
    </form>
  );
}

// ============================================================================
// EXAMPLE 6: Info Messages for Empty States
// ============================================================================

import { infoMessages } from "@/lib/notifications";

function TodayTab_New() {
  const todaysTx = store.transactions.filter(...);

  if (todaysTx.length === 0) {
    // Optional: show info notification
    // infoMessages.noTransactions();
    
    // Or just show in UI:
    return <div className="text-center text-muted">{infoMessages}</div>;
  }

  return <TransactionList transactions={todaysTx} />;
}

// ============================================================================
// USAGE SUMMARY
// ============================================================================

/*

IMPORT PATTERNS:

// For general notifications
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from "@/lib/notifications";

// For predefined messages
import { successMessages, errorMessages, warningMessages, infoMessages } from "@/lib/notifications";

// For validation
import { validateAndNotify, batchValidate } from "@/lib/notifications";

// For async operations
import { withErrorHandling } from "@/lib/notifications";

// Or import everything
import { Notifications } from "@/lib/notifications";

COMMON PATTERNS:

1. Simple validation:
   if (!validateAndNotify(condition, "Error message")) return;

2. Multiple validations:
   if (!batchValidate([...validations])) return;

3. Async with error handling:
   const result = await withErrorHandling(asyncFn, { successMessage: "..." });

4. Predefined success:
   successMessages.saved();
   successMessages.created("Item");

5. Predefined errors:
   errorMessages.validation("fieldName");
   errorMessages.insufficientBalance();

6. Custom messages:
   notifySuccess({ title: "...", description: "..." });
   notifyError("Error message");

*/
