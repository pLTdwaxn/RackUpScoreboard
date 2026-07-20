import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TopBar from "@/components/TopBar/TopBar";

describe("TopBar", () => {
  it("places the first three children into left, center, and right regions", () => {
    render(
      <TopBar>
        <button type="button">Menu</button>
        <span>Room 1</span>
        <button type="button">Theme</button>
      </TopBar>,
    );

    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByText("Room 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  });
});
