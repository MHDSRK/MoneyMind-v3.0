import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "@/App";
import { StoreProvider, useStore, archiveRecord } from "@/hooks/useStore";

function SeedArchivedAccount() {
  const { updateStore } = useStore();
  const seededRef = React.useRef(false);

  React.useEffect(() => {
    if (seededRef.current) {
      return;
    }

    seededRef.current = true;

    updateStore((previous) => ({
      ...previous,
      accounts: archiveRecord(previous.accounts, "cash-in-hand"),
    }));
  }, [updateStore]);

  return null;
}

function StoreProbe() {
  const { store } = useStore();

  React.useEffect(() => {
    (window as any).__MM_TEST_STORE__ = store;
  }, [store]);

  return null;
}

function renderApp(options?: { seedArchivedAccount?: boolean }) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <StoreProvider>
        {options?.seedArchivedAccount ? <SeedArchivedAccount /> : null}
        <StoreProbe />
        <App />
      </StoreProvider>
    );
  });

  return { container, root };
}

function getButtonByText(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll("button")).find((node) =>
    node.textContent?.trim().includes(text)
  ) as HTMLButtonElement | undefined;

  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }

  return button;
}

describe("MoneyMind app smoke flow", () => {
  it("throws when useStore is used outside the provider", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    function Harness() {
      useStore();
      return null;
    }

    expect(() => {
      act(() => {
        root.render(<Harness />);
      });
    }).toThrow("useStore must be used inside StoreProvider");

    act(() => {
      root.unmount();
      container.remove();
    });
  });

  it("renders the home screen and the liabilities section", () => {
    const { container, root } = renderApp();

    expect(container.textContent).toContain("MoneyMind");
    expect(container.textContent).toContain("NET WORTH");
    expect(container.textContent).toContain("More");

    act(() => {
      root.unmount();
      container.remove();
    });
  });

  it("restores an archived account from Profile -> Archived", () => {
    const { container, root } = renderApp({ seedArchivedAccount: true });

    const archivedBefore = (window as any).__MM_TEST_STORE__.accounts.find(
      (account: { id: string; archivedAt?: string }) => account.id === "cash-in-hand"
    );
    expect(Boolean(archivedBefore?.archivedAt)).toBe(true);

    const profileButton = container.querySelector('img[alt="Profile"]')?.closest("button") as HTMLButtonElement | null;
    if (!profileButton) {
      throw new Error("Profile button not found");
    }

    act(() => {
      profileButton.click();
    });

    act(() => {
      getButtonByText(container, "Archived").click();
    });

    expect(container.textContent).toContain("Archived");
    expect(container.textContent).toContain("Cash in hand");

    act(() => {
      getButtonByText(container, "Restore").click();
    });

    expect(container.textContent).toContain("No archived records");

    const archivedAfter = (window as any).__MM_TEST_STORE__.accounts.find(
      (account: { id: string; archivedAt?: string }) => account.id === "cash-in-hand"
    );
    expect(archivedAfter?.archivedAt).toBeUndefined();

    act(() => {
      root.unmount();
      container.remove();
    });
  });
});
