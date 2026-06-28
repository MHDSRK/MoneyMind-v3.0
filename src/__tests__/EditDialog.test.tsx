import { describe, expect, it } from "vitest";
import { shouldClearOnFocus } from "@/components/EditDialog";

describe("EditDialog", () => {
  it("clears placeholder-style values on focus", () => {
    expect(shouldClearOnFocus("0")).toBe(true);
    expect(shouldClearOnFocus("0.00")).toBe(true);
    expect(shouldClearOnFocus("₹0.00")).toBe(true);
    expect(shouldClearOnFocus("Not set")).toBe(true);
    expect(shouldClearOnFocus("Hello")).toBe(false);
  });
});
