export type GameStateMessage = {
  type: "game_state";
  matchroom: Matchroom;
  players: Player[];
  scores: Record<string, number>;
  match_scores: Record<string, number>;
  match: Match;
  current_frame: Frame;
  frame_log: FrameLogEntry[];
  score_keeper: "self" | "opp" | "ref" | "any";
  history_depth?: number;
  next_frame_confirmations?: string[];
};

export type FrameLogEntry = {
  id: string;
  type: "visit";
  player_key: string;
  player_name: string;
  history_ids: string[];
  potted_balls: string[];
  shot_count: number;
  break_points: number;
  foul_points: number;
  result: "in_progress" | "ended" | "foul" | "frame_won";
  message: string;
};

export type ErrorMessage = {
  type: "error";
  message: string;
  action_id?: string;
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

export type Matchroom = {
  id: string;
  roomCode: string;
  clubId: string;
  scoreKeepingMode: "self" | "opp" | "ref" | "any";
  status: "pending" | "active" | "finished";
};

export type Match = {
  id: string;
  name: string;
  frames_to_win: number | null;
  match_importance: string;
  highest_break: number | null;
};

export type Frame = {
  status: "ready" | "active" | "finished";
  scores: Record<string, number>;
  current_turn: string;
  current_break: number;
  points_remaining: number;
  previously_fouled?: boolean;
  reds_remaining: number;
  colours_on_table: Record<string, boolean>;
  object_ball: string;
  points_gap: number;
  snookers_required: number;
  highest_break: number | null;
  winner_key: string | null;
};

export type Player = {
  session_key: string;
  name: string;
  type: string;
  match_score: number;
  current_frame_score: number;
  highest_break: number | null;
  decorations?: Decoration[];
};

type Decoration = "defending_champion" | "title_challenger";

export type MatchroomConnection = {
  matchroomId: string;
  playerKey: string;
  displayName: string;
  identityType: "verified" | "anonymous";
};

export type RoomClientShotAction = {
  action_id?: string;
  action: "shot";
  data: {
    potted_balls: string[];
    foul: number;
  };
};

export type RoomClientUndoAction = {
  action_id?: string;
  action: "undo";
  data: Record<string, never>;
};

export type RoomClientPassShotAction = {
  action: "pass_shot";
  data: Record<string, never>;
};

export type RoomClientDeclareFreeBallAction = {
  action: "declare_free_ball";
  data: Record<string, never>;
};

export type RoomClientConcedeAction = {
  action_id?: string;
  action: "concede";
  data: Record<string, never>;
};

export type RoomClientNextFrameAction = {
  action_id?: string;
  action: "next_frame";
  data: Record<string, never>;
};

export type RoomClientAction =
  | RoomClientShotAction
  | RoomClientUndoAction
  | RoomClientPassShotAction
  | RoomClientDeclareFreeBallAction
  | RoomClientConcedeAction
  | RoomClientNextFrameAction;
