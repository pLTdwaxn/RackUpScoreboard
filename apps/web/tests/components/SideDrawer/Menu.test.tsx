import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Menu from "@/components/SideDrawer/Menu";

vi.mock("@/lib/version", () => ({
  appVersionLabel: "test-version",
}));

describe("Menu", () => {
  afterEach(cleanup);

  it("opens the settings drawer with the app version", () => {
    render(<Menu />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("test-version")).toBeInTheDocument();
  });
});
