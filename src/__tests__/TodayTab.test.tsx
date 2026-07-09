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

  it("renders a compact transaction row without permanent edit or delete buttons", () => {
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

    const rowButton = container.querySelector("button[type='button']");
    const editButton = container.querySelector("button[aria-label='Edit transaction']");
    const deleteButton = container.querySelector("button[aria-label='Delete transaction']");

    expect(rowButton).not.toBeNull();
    expect(editButton).toBeNull();
    expect(deleteButton).toBeNull();
    expect(container.textContent).toContain("Monthly Salary Payment");
    expect(container.textContent).toContain("Salary receipt");

    act(() => {
      root.unmount();
    });

    container.remove();
  });
});
