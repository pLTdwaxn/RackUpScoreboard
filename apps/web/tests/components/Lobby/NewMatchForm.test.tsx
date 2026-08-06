import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NewMatchForm from "@/components/Lobby/NewMatchForm";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("NewMatchForm", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "http://api.test");
    pushMock.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("creates a match with free-for-all scorekeeping by default", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        matchroom_id: "new-room",
        display_name: "Ada",
        player_key: "player-session",
        identity_type: "anonymous",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    render(<NewMatchForm />);

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: " Ada " },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create" }).closest("form")!,
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/matchroom/new-room");
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: "Ada",
        score_keeper: "any",
      }),
    });
  });

  it("creates a match with selected self scorekeeping", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        matchroom_id: "new-room",
        display_name: "Ada",
        player_key: "player-session",
        identity_type: "anonymous",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    render(<NewMatchForm />);

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Ada" },
    });
    const bestOfFramesOption = screen.getByRole("option", {
      name: "Best of Frames",
    });
    expect(bestOfFramesOption).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(bestOfFramesOption.className).toContain(
      "data-[selected=true]:bg-success/15",
    );
    expect(
      screen.getByText("Play until one player wins the required number of frames."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Open Ended" }));
    expect(
      screen.getByText("Play without a fixed frame target."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Any player can scorekeep."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Self" }));
    expect(
      screen.getByText("The player at the table is scorekeeping."),
    ).toBeInTheDocument();
    fireEvent.submit(
      screen.getByRole("button", { name: "Create" }).closest("form")!,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/connect",
        expect.objectContaining({
          body: JSON.stringify({
            display_name: "Ada",
            score_keeper: "self",
          }),
        }),
      );
    });
  });
});
