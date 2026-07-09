import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/hooks/useStore";

function UpdateStoreContractTest() {
  const { updateStore } = useStore();
  const [effectRuns, setEffectRuns] = useState(0);
  const [didUpdate, setDidUpdate] = useState(false);

  useEffect(() => {
    setEffectRuns((previous) => previous + 1);
  }, [updateStore]);

  useEffect(() => {
    if (didUpdate) return;

    updateStore((prev) => ({
      ...prev,
      accounts: [...prev.accounts],
    }));

    setDidUpdate(true);
  }, [didUpdate, updateStore]);

  return <div>{effectRuns}</div>;
}

describe("useStore updateStore contract", () => {
  it("keeps updateStore stable across renders so effect dependencies do not loop", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <UpdateStoreContractTest />
        </StoreProvider>,
      );
    });

    expect(container.textContent).toBe("1");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
