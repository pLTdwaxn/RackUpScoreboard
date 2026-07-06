import { Frame, GameStateMessage, Match, Player, TableState } from "@/types";

export const DEFAULT_MATCH: Match = {
  id: "",
  name: "",
  frames_to_win: null,
  winning_condition: "Open frame",
  match_importance: "Practice Match",
  highest_break: null,
};

export const DEFAULT_FRAME: Frame = {
  points_remaining: 0,
  points_gap: 0,
  snookers_required: 0,
  highest_break: null,
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

export type ScoreboardViewModel = {
  match: Match;
  frame: Frame;
  table: TableState;
  scoreKeeper: GameStateMessage["score_keeper"];
  players: Player[];
  roomReady: boolean;
};

export function buildScoreboardViewModel({
  gameState,
  players,
}: {
  gameState: GameStateMessage | null;
  players: Player[];
}): ScoreboardViewModel {
  const match = gameState?.match ?? DEFAULT_MATCH;
  const frame = gameState?.frame ?? DEFAULT_FRAME;
  const table = gameState?.table ?? DEFAULT_TABLE;
  const scoreKeeper = gameState?.score_keeper ?? "opp";
  const roomReady = players.length >= 2;

  return {
    match,
    frame,
    table,
    scoreKeeper,
    players,
    roomReady,
  };
}
