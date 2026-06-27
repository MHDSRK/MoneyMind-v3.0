export function formatAppDate(date: Date | string | number | null | undefined, fallback = "-") {
  if (date === null || date === undefined || date === "") return fallback;

  const parsedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return fallback;

  return parsedDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "/");
}
