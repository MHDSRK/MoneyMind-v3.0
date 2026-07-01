import { describe, it, expect } from "vitest";
import { freezeArchivedRecords, normalizeStore, Store } from "@/hooks/useStore";

describe("freezeArchivedRecords", () => {
  const createStore = (overrides: Partial<Store> = {}): Store => ({
    transactions: [],
    accounts: [],
    creditCards: [],
    loans: [],
    liabilities: [],
    lends: [],
    categories: [],
    history: [],
    ...overrides,
  });

  it("preserves archived records unchanged when the next store attempts an edit", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Edited Savings",
            type: "bank",
            balance: 2000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).toBe(previous.accounts[0]);
    expect(frozen.accounts[0].name).toBe("Archived Savings");
    expect(frozen.accounts[0].balance).toBe(1000);
  });

  it("allows archived records to be restored when archivedAt is cleared", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Restored Savings",
            type: "bank",
            balance: 1500,
            archivedAt: undefined,
            isArchived: false,
          },
        ],
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).not.toBe(previous.accounts[0]);
    expect(frozen.accounts[0].name).toBe("Restored Savings");
    expect(frozen.accounts[0].balance).toBe(1500);
  });

  it("keeps archived records from being deleted or filtered out by automations", () => {
    const previous = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-1",
            name: "Archived Savings",
            type: "bank",
            balance: 1000,
            archivedAt: "2026-05-01T00:00:00.000Z",
            isArchived: true,
          },
        ],
      })
    );

    const next = normalizeStore(
      createStore({
        accounts: [] as any,
      })
    );

    const frozen = freezeArchivedRecords(previous, next);

    expect(frozen.accounts).toHaveLength(1);
    expect(frozen.accounts[0]).toEqual(previous.accounts[0]);
  });

  it("preserves account notes during store normalization", () => {
    const input = normalizeStore(
      createStore({
        accounts: [
          {
            id: "acct-2",
            name: "Lent to Ravi",
            type: "other",
            balance: 100,
            notes: "Paid on June 15",
            deleted: false,
          },
        ],
      })
    );

    expect(input.accounts).toHaveLength(1);
    expect(input.accounts[0].notes).toBe("Paid on June 15");
  });
});
