import { type KeyboardEvent } from "react";

interface EditableFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
  helper?: string;
}

export function EditableField({ label, value, onEdit, helper }: EditableFieldProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer select-none items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left last:border-0 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label={`${label}: ${value}`}
    >
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground truncate">{value}</p>
        {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
      </div>
    </div>
  );
}
