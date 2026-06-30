import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { TodayTab } from "@/components/TodayTab";

function SeededTodayTab() {
  const { updateStore } = useStore();

  useEffect(() => {
    updateStore((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          id: "bank-1",
          name: "Bank Account",
          type: "bank",
          balance: 1000,
          deleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      transactions: [
        ...prev.transactions,
        {
          id: "tx-1",
          date: new Date().toISOString().split("T")[0],
          ledger: "Monthly Salary Payment",
          amount: 1000,
          type: "in",
          category: "Salary",
          account: "Bank Account",
          notes: "Salary receipt",
          deleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStore]);

  return <TodayTab />;
}

describe("TodayTab", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders icon-only edit and delete actions for today's cash flow rows", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededTodayTab />
        </StoreProvider>,
      );
    });

    const editButton = container.querySelector("button[aria-label='Edit transaction']");
    const deleteButton = container.querySelector("button[aria-label='Delete transaction']");

    expect(editButton).not.toBeNull();
    expect(deleteButton).not.toBeNull();
    expect(editButton?.querySelector("svg")).not.toBeNull();
    expect(deleteButton?.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toContain("Edit\n");
    expect(container.textContent).not.toContain("Edit ");

    act(() => {
      root.unmount();
    });

    container.remove();
  });
});
