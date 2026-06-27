import { Archive, Clock3, History, X } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DetailsActionVariant = "primary" | "secondary" | "warning";

export interface DetailsAction {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: DetailsActionVariant;
  onClick?: () => void;
}

interface DetailsActionFooterProps {
  actions?: DetailsAction[];
  onClose?: () => void;
  children?: ReactNode;
}

const variantClassName: Record<DetailsActionVariant, string> = {
  primary: "bg-primary text-primary-foreground border border-primary-border hover:bg-primary/90",
  secondary: "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
  warning: "bg-destructive text-white border border-destructive/40 hover:bg-destructive/90",
};

export function DetailsActionFooter({ actions = [], onClose, children }: DetailsActionFooterProps) {
  const renderedActions = actions.filter((action) => action.key !== "close");
  const closeAction = actions.find((action) => action.key === "close");

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
      {children ? <div className="flex-1">{children}</div> : null}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end">
        {renderedActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              type="button"
              variant="secondary"
              size="lg"
              onClick={action.onClick}
              className={cn(
                "h-11 flex-1 min-w-0 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium",
                variantClassName[action.variant ?? "secondary"],
              )}
            >
              {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
              <span>{action.label}</span>
            </Button>
          );
        })}
        {closeAction ? (
          <Button
            key={closeAction.key}
            type="button"
            variant="default"
            size="lg"
            onClick={closeAction.onClick ?? onClose}
            className="h-11 flex-1 min-w-0 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium"
          >
            <X className="h-[18px] w-[18px]" />
            <span>{closeAction.label}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
