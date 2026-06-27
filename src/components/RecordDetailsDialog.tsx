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

        {children ? <div className="mt-4 space-y-4">{children}</div> : null}

        <div className="mt-4 space-y-3">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{detail.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{detail.value}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">{actions}</div>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
