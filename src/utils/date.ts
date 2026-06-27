import { formatAppDate as formatAppDateImpl } from "./dateFormatter";

export function formatDisplayDate(value?: string | Date | null, fallback = "Not set") {
  return formatAppDateImpl(value ?? undefined, fallback);
}

export { formatAppDateImpl as formatAppDate };
