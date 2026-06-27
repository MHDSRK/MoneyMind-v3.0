import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { DetailsActionFooter } from "./DetailsActionFooter";

describe("DetailsActionFooter", () => {
  it("renders close as the last action and keeps the shared styling", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <DetailsActionFooter
          actions={[
            { key: "archive", label: "Archive", variant: "warning" },
            { key: "close", label: "Close", variant: "primary" },
          ]}
          onClose={() => undefined}
        />,
      );
    });

    const buttons = Array.from(container.querySelectorAll("button")).map((button) => button.textContent?.trim());

    expect(buttons).toEqual(["Archive", "Close"]);
    expect(buttons[1]).toBe("Close");
    expect(container.querySelectorAll("button")[1]?.className).toContain("bg-primary");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
