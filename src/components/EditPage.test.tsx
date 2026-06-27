import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { EditPage } from "./EditPage";
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
});
