/**
 * Centralized Notification System
 * Provides consistent success, warning, error, and info messages
 * across the entire application.
 */

import { toast as toastFn } from "@/hooks/use-toast";

export type NotificationType = "success" | "warning" | "error" | "info";

interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number; // milliseconds, 0 for persistent
}

/**
 * Show a success notification
 */
export function notifySuccess(options: NotificationOptions | string) {
  const opts = typeof options === "string" ? { title: options } : options;
  
  return toastFn({
    title: opts.title,
    description: opts.description,
    variant: "default",
  });
}

/**
 * Show an informational notification
 */
export function notifyInfo(options: NotificationOptions | string) {
  const opts = typeof options === "string" ? { title: options } : options;
  
  return toastFn({
    title: opts.title,
    description: opts.description,
    variant: "default",
  });
}

/**
 * Show a warning notification
 */
export function notifyWarning(options: NotificationOptions | string) {
  const opts = typeof options === "string" ? { title: options } : options;
  
  return toastFn({
    title: opts.title,
    description: opts.description,
    variant: "default",
  });
}

/**
 * Show an error notification
 */
export function notifyError(options: NotificationOptions | string) {
  const opts = typeof options === "string" ? { title: options } : options;
  
  return toastFn({
    title: opts.title,
    description: opts.description,
    variant: "destructive",
  });
}

/**
 * Common success scenarios
 */
export const successMessages = {
  saved: () => notifySuccess("Changes saved successfully"),
  created: (type: string) => notifySuccess(`${type} created successfully`),
  updated: (type: string) => notifySuccess(`${type} updated successfully`),
  deleted: (type: string) => notifySuccess(`${type} deleted successfully`),
  exported: () => notifySuccess("Data exported successfully"),
  imported: () => notifySuccess("Data imported successfully"),
  backedUp: () => notifySuccess("Backup created successfully"),
  restored: () => notifySuccess("Backup restored successfully"),
  downloaded: () => notifySuccess("File downloaded successfully"),
  uploaded: () => notifySuccess("File uploaded successfully"),
};

/**
 * Common error scenarios
 */
export const errorMessages = {
  validation: (field: string) => notifyError({
    title: "Validation Error",
    description: `Please check the ${field} field`,
  }),
  required: (field: string) => notifyError({
    title: "Required Field",
    description: `${field} is required`,
  }),
  invalidFormat: (field: string) => notifyError({
    title: "Invalid Format",
    description: `${field} has an invalid format`,
  }),
  minValue: (field: string, min: number) => notifyError({
    title: "Invalid Value",
    description: `${field} must be at least ${min}`,
  }),
  maxValue: (field: string, max: number) => notifyError({
    title: "Invalid Value",
    description: `${field} cannot exceed ${max}`,
  }),
  insufficientBalance: () => notifyError({
    title: "Insufficient Balance",
    description: "The amount exceeds available balance",
  }),
  duplicate: (type: string) => notifyError({
    title: "Duplicate Entry",
    description: `This ${type} already exists`,
  }),
  notFound: (type: string) => notifyError({
    title: "Not Found",
    description: `The requested ${type} was not found`,
  }),
  failed: (action: string) => notifyError({
    title: "Operation Failed",
    description: `Failed to ${action}. Please try again.`,
  }),
  unexpected: () => notifyError({
    title: "Unexpected Error",
    description: "An unexpected error occurred. Please try again later.",
  }),
};

/**
 * Common warning scenarios
 */
export const warningMessages = {
  unsavedChanges: () => notifyWarning({
    title: "Unsaved Changes",
    description: "You have unsaved changes",
  }),
  noData: () => notifyWarning({
    title: "No Data",
    description: "There is no data to display",
  }),
  largeFile: () => notifyWarning({
    title: "Large File",
    description: "This file is quite large and may take longer to process",
  }),
  lowBalance: (amount: number) => notifyWarning({
    title: "Low Balance",
    description: `Your available balance is ${amount}`,
  }),
  expiring: (type: string, daysLeft: number) => notifyWarning({
    title: `${type} Expiring Soon`,
    description: `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`,
  }),
};

/**
 * Common info scenarios
 */
export const infoMessages = {
  loading: () => notifyInfo("Loading..."),
  processing: () => notifyInfo("Processing..."),
  syncing: () => notifyInfo("Syncing data..."),
  checkingConnection: () => notifyInfo("Checking connection..."),
  noTransactions: () => notifyInfo("No transactions found"),
  emptyList: (type: string) => notifyInfo(`No ${type} to display`),
};

/**
 * Validate and show error if validation fails
 * Returns true if valid, false if invalid
 */
export function validateAndNotify(
  condition: boolean,
  errorMsg: string | { title: string; description?: string }
): boolean {
  if (!condition) {
    if (typeof errorMsg === "string") {
      notifyError(errorMsg);
    } else {
      notifyError(errorMsg);
    }
    return false;
  }
  return true;
}

/**
 * Batch validation - check multiple conditions
 * Returns true if all valid, false if any invalid
 */
export function batchValidate(
  validations: Array<{
    condition: boolean;
    error: string | { title: string; description?: string };
  }>
): boolean {
  for (const { condition, error } of validations) {
    if (!validateAndNotify(condition, error)) {
      return false;
    }
  }
  return true;
}

/**
 * Wrap an async operation with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string | NotificationOptions;
    errorTitle?: string;
    onError?: (error: Error) => void;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    if (options?.successMessage) {
      typeof options.successMessage === "string"
        ? notifySuccess(options.successMessage)
        : notifySuccess(options.successMessage);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    notifyError({
      title: options?.errorTitle || "Operation Failed",
      description: message,
    });
    options?.onError?.(error instanceof Error ? error : new Error(message));
    return null;
  }
}

/**
 * Export all notifications as a single object for convenience
 */
export const Notifications = {
  success: notifySuccess,
  info: notifyInfo,
  warning: notifyWarning,
  error: notifyError,
  validate: validateAndNotify,
  batchValidate,
  withErrorHandling,
  messages: {
    success: successMessages,
    error: errorMessages,
    warning: warningMessages,
    info: infoMessages,
  },
};
