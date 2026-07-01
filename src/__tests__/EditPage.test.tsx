import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { EditPage } from "../components/EditPage";
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
  it("keeps all major categories collapsed by default", () => {
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

    const assetsButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Assets"));
    expect(assetsButton).toBeTruthy();
    expect(assetsButton?.getAttribute("aria-expanded")).toBe("false");

    const creditCardButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Credit Cards"));
    expect(creditCardButton).toBeTruthy();
    expect(creditCardButton?.getAttribute("aria-expanded")).toBe("false");

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

    const dueDateRow = Array.from(container.querySelectorAll("[role='button']")).find((element) => element.textContent?.includes("Due Date"));
    expect(dueDateRow).toBeTruthy();
    expect(dueDateRow?.tagName).not.toBe("BUTTON");

    act(() => {
      dueDateRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialogInput = Array.from(document.body.querySelectorAll("input")).find((input) => input.getAttribute("type") === "date");
    expect(dialogInput).toBeTruthy();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
