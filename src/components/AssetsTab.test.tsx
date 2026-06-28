import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { AssetsTab } from "./AssetsTab";

function SeededAssetsTab() {
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
        {
          id: "lent-1",
          name: "Lent",
          type: "other",
          balance: 500,
          deleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStore]);

  return <AssetsTab />;
}

describe("AssetsTab", () => {
  it("shows active tracking Lent accounts in the Lent section and excludes them from total assets", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededAssetsTab />
        </StoreProvider>,
      );
    });

    const text = container.textContent ?? "";

    expect(text).toContain("Lent");
    expect(text).toContain("Lent Account");
    expect(text).toContain("₹1,000.00");
    expect(text).not.toContain("₹1,500.00");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
