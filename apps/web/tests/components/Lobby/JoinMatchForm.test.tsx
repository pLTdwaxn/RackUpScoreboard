import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JoinMatchForm from "@/components/Lobby/JoinMatchForm";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("JoinMatchForm", () => {
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

  it("requires a matchroom ID before joining", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<JoinMatchForm />);

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Ada" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Join" }).closest("form")!,
    );

    expect(
      await screen.findByText("Enter a matchroom ID to join."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("joins with an initial matchroom ID and navigates to the room", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        matchroom_id: "room 1",
        display_name: "Ada",
        player_key: "player-session",
        identity_type: "anonymous",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    render(<JoinMatchForm initialMatchroomId="room 1" />);

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: " Ada " },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Join" }).closest("form")!,
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/matchroom/room%201");
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: "Ada",
        matchroom_id: "room 1",
      }),
    });
  });
});
