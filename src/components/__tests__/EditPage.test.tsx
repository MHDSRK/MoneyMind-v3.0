import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import { EditPage } from "../EditPage";
import { AssetsTab } from "../AssetsTab";
import { HomeTab } from "../HomeTab";
import { StoreProvider, useStore } from "@/hooks/useStore";

function SeededEditPage() {
  const { updateStore } = useStore();

  useEffect(() => {
    updateStore((prev) => ({
      ...prev,
      liabilities: [
        ...prev.liabilities,
        {
          id: "expense-1",
          group: "Regular Expenses",
          name: "Rent",
          amount: 1200,
          dueDate: "2025-02-01",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStore]);

  return <EditPage />;
}

describe("EditPage", () => {
  it("uses a picker-based date input for editable dates", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <EditPage />
        </StoreProvider>,
      );
    });

    const dueDateButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Due Date"));
    expect(dueDateButton).toBeTruthy();

    act(() => {
      dueDateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialogInput = document.body.querySelector("input[type='date']") as HTMLInputElement | null;
    expect(dialogInput).toBeTruthy();
    expect(dialogInput?.type).toBe("date");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("orders the edit center groups in the approved navigation sequence", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <EditPage />
        </StoreProvider>,
      );
    });

    const groupLabels = Array.from(container.querySelectorAll("button"))
      .map((button) => button.textContent?.trim())
      .filter((text): text is string => Boolean(text) && [
        "Bank & Cash",
        "Business",
        "Investments",
        "Insurance",
        "Lent",
        "Credit Cards",
        "Loans",
        "Regular Expenses",
        "Chitty",
        "Borrow",
        "More Liabilities",
      ].includes(text));

    expect(groupLabels).toEqual([
      "Bank & Cash",
      "Business",
      "Investments",
      "Insurance",
      "Lent",
      "Credit Cards",
      "Loans",
      "Regular Expenses",
      "Chitty",
      "Borrow",
      "More Liabilities",
    ]);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("uses a date input for liability due dates", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededEditPage />
        </StoreProvider>,
      );
    });

    const accordionButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Rent"));
    expect(accordionButton).toBeTruthy();

    act(() => {
      accordionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dueDateButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Due Date"));
    expect(dueDateButton).toBeTruthy();

    act(() => {
      dueDateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialogInput = document.body.querySelector("input");
    expect(dialogInput?.getAttribute("type")).toBe("date");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("groups Lent-named accounts in the Lent section", () => {
    function SeededLentEditPage() {
      const { updateStore } = useStore();

      useEffect(() => {
        updateStore((prev) => ({
          ...prev,
          accounts: [
            ...prev.accounts,
            {
              id: "lent-account-1",
              name: "Lent to Ravi",
              type: "bank",
              group: "accounts",
              balance: 500,
              deleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      }, [updateStore]);

      return <EditPage />;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededLentEditPage />
        </StoreProvider>,
      );
    });

    const lentSectionButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Lent") && !button.textContent?.includes("Add Lent Item"));
    expect(lentSectionButton).toBeTruthy();

    act(() => {
      lentSectionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Lent to Ravi");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("does not count Lent accounts in AssetsTab or HomeTab totals", () => {
    function SeededLentFlow() {
      const { store, updateStore } = useStore();
      const [initialized, setInitialized] = useState(false);

      useEffect(() => {
        if (initialized) return;
        setInitialized(true);

        updateStore((prev) => ({
          ...prev,
          accounts: [
            ...prev.accounts,
            {
              id: "lent-account-2",
              name: "Lent to Priya",
              type: "bank",
              group: "accounts",
              balance: 700,
              deleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      }, [initialized, updateStore]);

      return (
        <>
          <EditPage />
          <AssetsTab />
          <HomeTab />
        </>
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededLentFlow />
        </StoreProvider>,
      );
    });

    const text = container.textContent ?? "";
    expect(text).toContain("Lent to Priya");
    expect(text).not.toContain("₹700.00");
    expect(text).not.toContain("₹1,700.00");
    expect(text).toContain("₹0.00");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
