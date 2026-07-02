import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ReactNode, useEffect, useState } from "react";
import { formatDisplayDate } from "@/utils/date";

/**
 * StandardizedDatePicker Implementation (EditDialog)
 * 
 * This is the SINGLE reusable date picker used throughout MoneyMind for all editable date fields:
 * - Credit Card: Due Date, Next Bill Date
 * - Loans: Next EMI Date
 * - Liabilities: Due Date (Regular Expenses, Chitty, Borrow, More Liabilities)
 * 
 * Key Features:
 * - Uses native HTML5 <input type="date"> with browser's built-in calendar picker
 * - Consistent behavior across desktop, iOS, and Android
 * - ReadOnly attribute prevents manual text entry - only calendar selection allowed
 * - showPicker() method opens calendar immediately on focus
 * - Prevents paste operations to ensure calendar is the only input method
 * - Dates stored in YYYY-MM-DD format (ISO date without time)
 * - Dates displayed as DD/MMM/YYYY via formatDisplayDate()
 * 
 * Platform Support:
 * - Desktop (Chrome, Firefox, Safari, Edge): Native calendar picker
 * - iOS: Native iOS date wheel picker
 * - Android: Native Android date picker
 */

interface EditDialogProps {
  open: boolean;
  title: string;
  description?: string;
  value: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  onClose: () => void;
  onSave: (newValue: string) => void;
}

export function shouldClearOnFocus(currentValue: string) {
  return ["0", "0.00", "₹0.00", "Not set"].includes(currentValue.trim());
}

export function EditDialog({
  open,
  title,
  description,
  value,
  type = "text",
  placeholder,
  onClose,
  onSave,
}: EditDialogProps) {
  const [draft, setDraft] = useState(value);

  const handleDateFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (type !== "date") {
      if (shouldClearOnFocus(draft)) {
        setDraft("");
      }
      return;
    }

    // Standardized date picker: Open native calendar picker on focus
    // Works consistently on desktop and mobile (iOS and Android)
    event.currentTarget.showPicker?.();
  };

  const handleDateKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (type !== "date") {
      if (event.key === "Enter") {
        event.preventDefault();
        onSave(draft);
        onClose();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onSave(draft);
      onClose();
      return;
    }

    if (event.key === "Tab" || event.key === "Escape") return;
    event.preventDefault();
  };

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="mt-4">
          {type === "date" ? (
            <p className="mb-2 text-xs text-muted-foreground">Select a date from the calendar.</p>
          ) : null}
          <input
            autoFocus
            type={type}
            value={draft}
            placeholder={placeholder}
            readOnly={type === "date"}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={handleDateFocus}
            onKeyDown={handleDateKeyDown}
            onPaste={(event) => {
              if (type === "date") {
                event.preventDefault();
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            // Standardized date picker settings:
            // - readOnly: Forces calendar picker only, no manual text entry
            // - type="date": Uses native HTML5 date input with built-in picker
            // - showPicker(): Triggered on focus to open calendar immediately
            // - paste prevented: Ensures calendar is the only input method
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
