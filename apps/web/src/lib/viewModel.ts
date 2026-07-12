import {
  Frame,
  GameStateMessage,
  Match,
  Matchroom,
  Player,
  TableState,
} from "@/types";

export const DEFAULT_MATCH: Match = {
  id: "",
  name: "",
  frames_to_win: null,
  match_importance: "Practice Match",
  highest_break: null,
};

export const DEFAULT_FRAME: Frame = {
  status: "ready",
  points_remaining: 0,
  points_gap: 0,
  scores: {},
  current_turn: "",
  previously_fouled: false,
  current_break: 0,
  reds_remaining: 15,
  colours_on_table: {
    yellow: true,
    green: true,
    brown: true,
    blue: true,
    pink: true,
    black: true,
  },
  object_ball: "red",
  snookers_required: 0,
  highest_break: null,
  winner_key: null,
};

export const DEFAULT_TABLE: TableState = {
  reds_remaining: 15,
  colours_on_table: {
    yellow: true,
    green: true,
    brown: true,
    blue: true,
    pink: true,
    black: true,
  },
  object_ball: "red",
  current_turn: "",
  current_break: 0,
  points_remaining: 0,
};

export const DEFAULT_MATCHROOM: Matchroom = {
  id: "",
  roomCode: "",
  clubId: "",
  scoreKeepingMode: "self" as const,
  status: "pending" as const,
};

export type ScoreboardViewModel = {
  matchroom: Matchroom;
  match: Match;
  frame: Frame;
  scoreKeeper: GameStateMessage["score_keeper"];
  players: Player[];
  matchScores: Record<string, number>;
  roomReady: boolean;
};

export function buildScoreboardViewModel({
  gameState,
}: {
  gameState: GameStateMessage | null;
}): ScoreboardViewModel {
  const matchroom = gameState?.matchroom ?? DEFAULT_MATCHROOM;
  const match = gameState?.match ?? DEFAULT_MATCH;
  const frame = gameState?.current_frame ?? DEFAULT_FRAME;
  const matchScores = gameState?.match_scores ?? {};
  const players = gameState?.players ?? [];
  const scoreKeeper = gameState?.score_keeper ?? "opp";
  const roomReady = players.length >= 2;

  return {
    matchroom,
    match,
    frame,
    matchScores,
    scoreKeeper,
    players,
    roomReady,
  };
}
