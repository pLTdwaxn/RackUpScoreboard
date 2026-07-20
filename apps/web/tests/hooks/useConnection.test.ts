import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useConnection } from "@/hooks/useConnection";

const ROOM_SESSION_KEY_STORAGE_KEY = "scoreboard.room_session_key";

describe("useConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "http://api.test///");
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("posts trimmed connection details and persists the returned session", async () => {
    const connectionUpdated = vi.fn();
    window.addEventListener("scoreboard:room-session-updated", connectionUpdated);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        matchroom_id: "room-1",
        display_name: "Ada",
        player_key: "player-session",
        identity_type: "verified",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useConnection());
    let connection: Awaited<ReturnType<typeof result.current.connect>> | null =
      null;

    await act(async () => {
      connection = await result.current.connect({
        displayName: " Ada ",
        matchroomId: " room-1 ",
        scoreKeeper: "self",
      });
    });

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: "Ada",
        matchroom_id: "room-1",
        score_keeper: "self",
      }),
    });
    expect(connection).toEqual({
      matchroomId: "room-1",
      displayName: "Ada",
      playerKey: "player-session",
      identityType: "verified",
    });
    expect(sessionStorage.getItem(ROOM_SESSION_KEY_STORAGE_KEY)).toBe(
      JSON.stringify({ "room-1": "player-session" }),
    );
    expect(connectionUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          matchroomId: "room-1",
          playerKey: "player-session",
        },
      }),
    );

    window.removeEventListener(
      "scoreboard:room-session-updated",
      connectionUpdated,
    );
  });

  it("sets a helpful error when the API rejects the connection", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        detail: "Matchroom not found.",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useConnection());
    let rejection: unknown;

    await act(async () => {
      try {
        await result.current.connect({
          displayName: "Ada",
          matchroomId: "missing-room",
        });
      } catch (error) {
        rejection = error;
      }
    });

    expect(rejection).toEqual(new Error("Matchroom not found."));
    expect(result.current.error).toBe("Matchroom not found.");
    expect(result.current.isSubmitting).toBe(false);
  });
});
