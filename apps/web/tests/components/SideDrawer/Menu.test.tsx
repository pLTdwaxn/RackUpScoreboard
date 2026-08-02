import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Menu from "@/components/SideDrawer/Menu";

vi.mock("@/lib/version", () => ({
  appVersionLabel: "test-version",
}));

vi.mock("@/components/ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

describe("Menu", () => {
  afterEach(cleanup);

  it("opens the settings drawer with the app version", () => {
    const onLeaveRoom = vi.fn();

    render(<Menu onLeaveRoom={onLeaveRoom} />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getAllByText("Theme")).toHaveLength(2);
    expect(screen.getByRole("listbox", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Scorekeeping" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Players" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Match rules" })).toBeInTheDocument();
    expect(screen.queryByText("Version")).not.toBeInTheDocument();
    expect(screen.getByText("test-version")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Leave Room/ }));
    expect(onLeaveRoom).toHaveBeenCalledOnce();
  });
});
