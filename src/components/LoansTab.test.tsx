import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LoansTab } from "./LoansTab";
import { StoreProvider } from "@/hooks/useStore";

describe("LoansTab", () => {
  it("promotes outstanding balance in the header and row copy", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <StoreProvider>
          <LoansTab />
        </StoreProvider>,
      );
    });

    const text = container.textContent ?? "";
    expect(text).toContain("Outstanding");
    expect(text).toContain("Next EMI");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
