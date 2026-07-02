import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { CreditCardsTab } from "./CreditCardsTab";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { useEffect } from "react";

function SeededCardPage() {
  const { updateStore } = useStore();

  useEffect(() => {
    updateStore((prev) => ({
      ...prev,
      creditCards: [
        {
          id: "test-card-1",
          name: "Test Card",
          provider: "Test Bank",
          creditLimit: 0,
          outstanding: 0,
          unbilled: 0,
          statementDate: 1,
          dueDate: "2026-07-31",
          nextDueDate: "2026-07-22T10:00:00.000Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStore]);

  return <CreditCardsTab />;
}

describe("CreditCardsTab", () => {
  it("renders the due date as a day number and formats next bill date", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededCardPage />
        </StoreProvider>,
      );
    });

    const text = container.textContent ?? "";
    expect(text).toContain("Due Date");
    expect(text).toContain("31/Jul/2026");
    expect(text).toContain("22/Jul/2026");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
