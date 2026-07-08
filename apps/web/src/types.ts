export type GameStateMessage = {
  type: "game_state";
  players: Player[];
  table: TableState;
  match: Match;
  frame: Frame;
  score_keeper: "self" | "opp" | "ref" | "any";
  history_depth?: number;
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type PlayerStatusChangeMessage = {
  type: "player_status_change";
  key: string;
  status: "disconnected";
};

export type RoomSocketMessage =
  | GameStateMessage
  | ErrorMessage
  | PlayerStatusChangeMessage;

export type TableState = {
  reds_remaining: number;
  colours_on_table: Record<string, boolean>;
  object_ball: string;
  current_turn: string;
  current_break: number;
  points_remaining: number;
};

export type Match = {
  id: string;
  name: string;
  frames_to_win: number | null;
  winning_condition: string;
  match_importance: string;
  highest_break: number | null;
};

export type Frame = {
  status: "ready" | "active" | "finished";
  points_remaining: number;
  points_gap: number;
  snookers_required: number;
  highest_break: number | null;
  winner_key: string | null;
};

export type Player = {
  key: string;
  name: string;
  type: string;
  match_score: number;
  current_frame_score: number;
  highest_break: number | null;
  decorations?: Decoration[];
};

type Decoration = "defending_champion" | "title_challenger";

export type ConnectedInstance = {
  instanceId: string;
  displayName: string;
  playerKey?: string;
};
