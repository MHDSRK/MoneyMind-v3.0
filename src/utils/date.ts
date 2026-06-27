import { format } from "date-fns";

export function formatDisplayDate(value?: string | Date | null, fallback = "Not set") {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return format(date, "dd/LLL/yyyy");
}
