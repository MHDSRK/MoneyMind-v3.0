import { describe, it, expect } from "vitest";
import { formatAppDate } from "@/utils/dateFormatter";

describe("date formatter", () => {
  it("formats date as DD/MMM/YYYY", () => {
    const formatted = formatAppDate("2026-07-03");
    // Example: 03/Jul/2026
    expect(formatted).toMatch(/\d{2}\/[A-Za-z]{3}\/\d{4}/);
  });
});
