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

  it("creates a match with opponent scorekeeping by default", async () => {
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
        score_keeper: "opp",
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
    fireEvent.click(screen.getByText("Self"));
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
