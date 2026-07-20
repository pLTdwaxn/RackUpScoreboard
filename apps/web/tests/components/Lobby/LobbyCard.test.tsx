import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LobbyCard from "@/components/Lobby/LobbyCard";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("LobbyCard", () => {
  afterEach(() => {
    cleanup();
    pushMock.mockClear();
  });

  it("shows the join workflow by default", () => {
    render(<LobbyCard />);

    expect(
      screen.getByRole("tab", { name: "Join" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter matchroom ID"),
    ).toBeInTheDocument();
  });

  it("switches to the create workflow", () => {
    render(<LobbyCard />);

    fireEvent.click(screen.getByRole("tab", { name: "Create" }));

    expect(
      screen.getByRole("tab", { name: "Create" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: "Create" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scorekeeping By")).toBeInTheDocument();
  });
});
