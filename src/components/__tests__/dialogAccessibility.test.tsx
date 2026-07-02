import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

describe("dialog accessibility wrappers", () => {
  it("renders hidden title and description content for dialogs", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <Dialog open>
          <DialogContent title="Test dialog" description="Test dialog description">
            <div>Dialog body</div>
          </DialogContent>
        </Dialog>
      );
    });

    expect(document.body.textContent).toContain("Test dialog");
    expect(document.body.textContent).toContain("Test dialog description");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders hidden title and description content for sheets", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <Sheet open>
          <SheetContent title="Test sheet" description="Test sheet description">
            <div>Sheet body</div>
          </SheetContent>
        </Sheet>
      );
    });

    expect(document.body.textContent).toContain("Test sheet");
    expect(document.body.textContent).toContain("Test sheet description");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
