import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConcedeFrameDialog from "@/components/Scoreboard/ConcedeFrameDialog";

describe("ConcedeFrameDialog", () => {
  afterEach(cleanup);

  it("confirms and closes a concede action", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConcedeFrameDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Conceding Frame")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concede" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without confirming when cancelled", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConcedeFrameDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
