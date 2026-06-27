import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface RecordDetailsDialogProps {
  open: boolean;
  title: string;
  description: string;
  details: Array<{ label: string; value: string }>;
  actions?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
}

export function RecordDetailsDialog({ open, title, description, details, actions, children, onClose }: RecordDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{detail.label}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{detail.value}</p>
            </div>
          ))}
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <DialogFooter className="mt-4 gap-2">
          <div className="flex-1">{actions}</div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
