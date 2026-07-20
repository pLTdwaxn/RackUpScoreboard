import { describe, expect, it } from "vitest";

import {
  buildScoreboardViewModel,
  DEFAULT_FRAME,
  DEFAULT_MATCH,
  DEFAULT_MATCHROOM,
} from "@/lib/viewModel";
import { GameStateMessage } from "@/types";

const gameState: GameStateMessage = {
  type: "game_state",
  matchroom: {
    id: "room-1",
    roomCode: "ABC123",
    clubId: "club-1",
    scoreKeepingMode: "self",
    status: "active",
  },
  players: [
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
  ],
  scores: {
    p1: 32,
    p2: 18,
  },
  match_scores: {
    p1: 1,
    p2: 0,
  },
  match: {
    id: "match-1",
    name: "Table 1",
    frames_to_win: 3,
    match_importance: "League Match",
    highest_break: 24,
  },
  current_frame: {
    ...DEFAULT_FRAME,
    status: "active",
    current_turn: "p1",
    points_remaining: 67,
  },
  frame_log: [],
  score_keeper: "self",
};

describe("buildScoreboardViewModel", () => {
  it("uses defaults before game state has loaded", () => {
    expect(buildScoreboardViewModel({ gameState: null })).toEqual({
      matchroom: DEFAULT_MATCHROOM,
      match: DEFAULT_MATCH,
      frame: DEFAULT_FRAME,
      matchScores: {},
      scoreKeeper: "opp",
      players: [],
      roomReady: false,
    });
  });

  it("maps loaded game state into render-ready values", () => {
    expect(buildScoreboardViewModel({ gameState })).toEqual({
      matchroom: gameState.matchroom,
      match: gameState.match,
      frame: gameState.current_frame,
      matchScores: gameState.match_scores,
      scoreKeeper: "self",
      players: gameState.players,
      roomReady: true,
    });
  });
});
