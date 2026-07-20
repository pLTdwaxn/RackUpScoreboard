import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import { GameStateMessage, Player } from "@/types";

const hookStateMock = vi.hoisted(() => ({
  game: vi.fn(),
  players: vi.fn(),
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomGame: hookStateMock.game,
}));

vi.mock("@/hooks/useMatchroomPlayers", () => ({
  useMatchroomPlayers: hookStateMock.players,
}));

const opponent: Player = {
  session_key: "p2",
  name: "Grace",
  type: "anonymous",
  match_score: 0,
  current_frame_score: 18,
  highest_break: null,
};

const gameState = {
  current_frame: {
    ...DEFAULT_FRAME,
    status: "active",
    current_turn: "p1",
    current_break: 16,
    previously_fouled: true,
    scores: {
      p1: 32,
      p2: 18,
    },
  },
  score_keeper: "self",
  next_frame_confirmations: ["p2"],
} as GameStateMessage;

describe("useMatchroomFrame", () => {
  afterEach(() => {
    hookStateMock.game.mockReset();
    hookStateMock.players.mockReset();
  });

  it("uses default frame values before game state has loaded", () => {
    hookStateMock.game.mockReturnValue({ gameState: null });
    hookStateMock.players.mockReturnValue({
      currentPlayerKey: "p1",
      opponent,
    });

    const { result } = renderHook(() => useMatchroomFrame());

    expect(result.current.hasFrame).toBe(false);
    expect(result.current.frame).toBe(DEFAULT_FRAME);
    expect(result.current.scoreKeeper).toBe("opp");
    expect(result.current.myScore).toBe(0);
    expect(result.current.opponentScore).toBe(0);
  });

  it("derives turn, break, score, and foul state for the current player", () => {
    hookStateMock.game.mockReturnValue({ gameState });
    hookStateMock.players.mockReturnValue({
      currentPlayerKey: "p1",
      opponent,
    });

    const { result } = renderHook(() => useMatchroomFrame());

    expect(result.current.hasFrame).toBe(true);
    expect(result.current.isMyTurn).toBe(true);
    expect(result.current.isOpponentTurn).toBe(false);
    expect(result.current.currentBreak).toBe(16);
    expect(result.current.myCurrentBreak).toBe(16);
    expect(result.current.opponentCurrentBreak).toBe(0);
    expect(result.current.previouslyFouled).toBe(true);
    expect(result.current.scoreKeeper).toBe("self");
    expect(result.current.nextFrameConfirmations).toEqual(["p2"]);
    expect(result.current.myScore).toBe(32);
    expect(result.current.opponentScore).toBe(18);
  });

  it("returns the winner only for a finished frame", () => {
    hookStateMock.game.mockReturnValue({
      gameState: {
        ...gameState,
        current_frame: {
          ...gameState.current_frame,
          status: "finished",
          winner_key: "p2",
        },
      },
    });
    hookStateMock.players.mockReturnValue({
      currentPlayerKey: "p1",
      opponent,
    });

    const { result } = renderHook(() => useMatchroomFrame());

    expect(result.current.winningPlayerKey).toBe("p2");
  });
});
