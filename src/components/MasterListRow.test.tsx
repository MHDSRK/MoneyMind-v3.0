import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { MasterListRow } from "./MasterListRow";

describe("MasterListRow", () => {
  it("renders a non-interactive container when interactive is false", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <MasterListRow
          name="Cash"
          amount={100}
          subtitle="Bank"
          onArchive={() => undefined}
          onClick={() => undefined}
          interactive={false}
        />,
      );
    });

    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("div")).not.toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
