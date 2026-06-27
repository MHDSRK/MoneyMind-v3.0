import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ReactNode, useEffect, useState } from "react";

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
          <input
            autoFocus
            type={type}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSave(draft);
                onClose();
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
