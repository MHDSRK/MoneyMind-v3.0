import { describe, it, expect } from "vitest";
import { createTransaction } from "@/lib/transactionEffects";

describe("transactions store category as name", () => {
  it("stores category as a string name, not an id", () => {
    const store = { 
      transactions: [],
      accounts: [{ id: "acc-1", name: "Cash", balance: 1000 }],
      creditCards: [], loans: [], liabilities: [], lends: [], categories: [], history: [] } as any;

    const updated = createTransaction(store, { type: "out", amount: 100, ledger: "X", category: "MyCategory", fromAccountId: "acc-1" });
    const tx = updated.transactions[0];
    expect(typeof tx.category).toBe("string");
    expect(tx.category).toBe("MyCategory");
  });
});
