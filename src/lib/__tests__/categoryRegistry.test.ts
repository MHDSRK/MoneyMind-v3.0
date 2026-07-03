import { describe, it, expect } from "vitest";
import { normalizeStore, DEFAULT_MONEY_OUT_CATEGORY_NAMES } from "@/hooks/useStore";

describe("category registry", () => {
  it("deduplicates category names case-insensitively within the same type", () => {
    const parsed = {
      categories: [
        { id: "c1", name: "Groceries", type: "out" },
        { id: "c2", name: "groceries", type: "out" },
      ],
      transactions: [],
    } as any;

    const store = normalizeStore(parsed);
    const outCats = store.categories.filter((c) => c.type === "out");
    const groceries = outCats.filter((c) => c.name.toLowerCase() === "groceries");
    expect(groceries).toHaveLength(1);
  });

  it("orders system categories before custom categories using the default system order", () => {
    // Provide system category names in reverse order to ensure sorting is applied
    const reversed = Array.from(DEFAULT_MONEY_OUT_CATEGORY_NAMES).slice().reverse();

    const parsed = {
      categories: reversed.map((name, idx) => ({ id: `s${idx}`, name, type: "out" })),
      transactions: [],
    } as any;

    const store = normalizeStore(parsed);
    const outSystemNames = store.categories
      .filter((c) => c.type === "out" && DEFAULT_MONEY_OUT_CATEGORY_NAMES.includes(c.name))
      .map((c) => c.name);

    expect(outSystemNames).toEqual(Array.from(DEFAULT_MONEY_OUT_CATEGORY_NAMES));
  });
});
