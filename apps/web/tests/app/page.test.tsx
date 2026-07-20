import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("Home page", () => {
  afterEach(() => {
    cleanup();
    pushMock.mockClear();
  });

  it("links users into the matchroom lobby", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Snooker Scoreboard" }));

    expect(pushMock).toHaveBeenCalledWith("/matchroom");
  });
});
