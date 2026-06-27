import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "./date";

describe("formatDisplayDate", () => {
  it("formats dates in dd/Mon/yyyy style", () => {
    expect(formatDisplayDate("2026-07-22T10:00:00.000Z")).toBe("22/Jul/2026");
  });

  it("falls back to the provided placeholder for invalid values", () => {
    expect(formatDisplayDate("not-a-date", "Not set")).toBe("Not set");
  });
});
