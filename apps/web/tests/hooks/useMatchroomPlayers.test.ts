import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { Player } from "@/types";

const socketStateMock = vi.hoisted(() => ({
  game: vi.fn(),
  session: vi.fn(),
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomGame: socketStateMock.game,
  useMatchroomSession: socketStateMock.session,
}));

const players: Player[] = [
  {
    session_key: "p1",
    name: "Ada",
    type: "anonymous",
    match_score: 1,
    current_frame_score: 32,
    highest_break: 24,
  },
  {
    session_key: "p2",
    name: "Grace",
    type: "anonymous",
    match_score: 0,
    current_frame_score: 18,
    highest_break: null,
  },
];

describe("useMatchroomPlayers", () => {
  afterEach(() => {
    socketStateMock.game.mockReset();
    socketStateMock.session.mockReset();
  });

  it("returns the current player and opponent for the session key", () => {
    socketStateMock.game.mockReturnValue({ players });
    socketStateMock.session.mockReturnValue({ sessionKey: "p1" });

    const { result } = renderHook(() => useMatchroomPlayers());

    expect(result.current.currentPlayerKey).toBe("p1");
    expect(result.current.me).toBe(players[0]);
    expect(result.current.opponent).toBe(players[1]);
    expect(result.current.players).toBe(players);
  });

  it("returns no current player when the session key is unknown", () => {
    socketStateMock.game.mockReturnValue({ players });
    socketStateMock.session.mockReturnValue({ sessionKey: "missing" });

    const { result } = renderHook(() => useMatchroomPlayers());

    expect(result.current.currentPlayerKey).toBe("missing");
    expect(result.current.me).toBeUndefined();
    expect(result.current.opponent).toBe(players[0]);
  });
});
