import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailsActionFooter } from "@/components/common/DetailsActionFooter";
import type { ReactNode } from "react";

interface RecordDetailsDialogProps {
  open: boolean;
  title: string;
  description?: string;
  details?: Array<{ label: string; value: string; valueClassName?: string }>;
  actions?: ReactNode;
  footerActions?: Array<{ key: string; label: string; icon?: any; variant?: "primary" | "secondary" | "warning"; onClick?: () => void }>;
  children?: ReactNode;
  hideDetailsList?: boolean;
  plainDetails?: boolean;
  onClose: () => void;
}

export function RecordDetailsDialog({ open, title, description, details = [], actions, footerActions, children, hideDetailsList = false, plainDetails = false, onClose }: RecordDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {children ? <div className="mt-3 space-y-3">{children}</div> : null}

        {!hideDetailsList && details.length > 0 ? (
          plainDetails ? (
            <div className="mt-3 space-y-3 text-sm">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4 rounded-2xl bg-transparent px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{detail.label}</p>
                  <p className={"text-sm font-semibold truncate text-right " + (detail.valueClassName ?? "text-foreground")}>{detail.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{detail.label}</p>
                  <p className={"mt-1 text-sm font-semibold " + (detail.valueClassName ?? "text-foreground")}>{detail.value}</p>
                </div>
              ))}
            </div>
          )
        ) : null}

        <DialogFooter className="mt-3">
          {footerActions ? (
            <DetailsActionFooter actions={footerActions} onClose={onClose}>
              {actions}
            </DetailsActionFooter>
          ) : (
            <div className="flex w-full items-center justify-end">
              <DetailsActionFooter actions={[{ key: "close", label: "Close", variant: "primary", onClick: onClose }]} />
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
