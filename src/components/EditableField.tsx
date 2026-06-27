import { Pencil } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
  helper?: string;
}

export function EditableField({ label, value, onEdit, helper }: EditableFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground truncate">{value}</p>
        {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
      </div>
      <button type="button" onClick={onEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors">
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
