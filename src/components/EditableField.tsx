interface EditableFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
  helper?: string;
}

export function EditableField({ label, value, onEdit, helper }: EditableFieldProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left last:border-0 transition-colors hover:bg-white/5"
    >
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground truncate">{value}</p>
        {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Edit</span>
    </button>
  );
}
