import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { HomeTab } from "../HomeTab";
import { SwipeableArchiveCard } from "../SwipeableArchiveCard";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { useEffect } from "react";

function SeededHomeTab() {
  const { updateStore } = useStore();

  useEffect(() => {
    updateStore((prev) => ({
      ...prev,
      creditCards: [
        {
          id: "test-card-1",
          name: "Test Card",
          provider: "Test Bank",
          cardType: "Visa",
          creditLimit: 1000,
          outstanding: 200,
          unbilled: 0,
          statementDate: 1,
          dueDate: "2026-07-04",
          nextDueDate: "2026-07-04T00:00:00.000Z",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStore]);

  return <HomeTab />;
}

describe("HomeTab swipe interaction", () => {
  it("hides the Mark as Paid action by default for upcoming dues", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <SeededHomeTab />
        </StoreProvider>,
      );
    });

    const dueSection = Array.from(container.querySelectorAll("div.glass-card")).find((section) =>
      section.textContent?.includes("Upcoming Dues"),
    );
    expect(dueSection).toBeTruthy();

    const dueRow = Array.from(dueSection?.querySelectorAll("div") ?? []).find((row) =>
      row.textContent?.includes("Test Card"),
    );
    expect(dueRow).toBeTruthy();

    const actionButton = Array.from(dueRow?.querySelectorAll("button") ?? []).find((button) =>
      button.textContent?.includes("Mark as Paid"),
    );
    expect(actionButton).toBeTruthy();

    const actionContainer = actionButton?.parentElement;
    expect(actionContainer).toBeTruthy();
    expect(window.getComputedStyle(actionContainer!).opacity).toBe("0");
    expect(window.getComputedStyle(actionContainer!).pointerEvents).toBe("none");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("reveals the action when the swipe item is open", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <SwipeableArchiveCard actionLabel="Mark as Paid" onArchive={() => {}} isOpen>
          <div>Swipe me</div>
        </SwipeableArchiveCard>,
      );
    });

    const actionContainer = container.querySelector("div.absolute.inset-y-0.right-0");
    expect(actionContainer).toBeTruthy();
    expect(window.getComputedStyle(actionContainer!).opacity).toBe("1");
    expect(window.getComputedStyle(actionContainer!).pointerEvents).toBe("auto");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("Mark as Paid flow: action click does not force-close the swipe item", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let archiveWasCalled = false;
    const handleArchive = () => {
      archiveWasCalled = true;
    };

    act(() => {
      root.render(
        <SwipeableArchiveCard
          actionLabel="Mark as Paid"
          onArchive={handleArchive}
          isOpen={true}
        >
          <div>Due: Test Card</div>
        </SwipeableArchiveCard>,
      );
    });

    expect(archiveWasCalled).toBe(false);

    // Click the Mark as Paid button
    const actionButton = container.querySelector("button[type='button']") as HTMLButtonElement;
    expect(actionButton?.textContent).toBe("Mark as Paid");

    act(() => {
      actionButton?.click();
    });

    expect(archiveWasCalled).toBe(true);

    // The key fix: swipe item should remain open (not force-closed)
    // so the parent component (HomeTab) can show the payment form below it
    const swipeContainer = container.querySelector("div.relative.z-10");
    expect(swipeContainer).toBeTruthy();

    // After clicking, the swipe should still be at full offset (open)
    const transform = window.getComputedStyle(swipeContainer!).transform;
    // Open state would have transform like "matrix(1, 0, 0, 1, -80, 0)" or translateX(-80px)
    expect(transform).toBeTruthy();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
