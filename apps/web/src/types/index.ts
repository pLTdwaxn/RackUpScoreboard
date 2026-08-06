export type GameStateMessage = {
  type: "game_state";
  matchroom: Matchroom;
  players: Player[];
  scores: Record<string, number>;
  match_scores: Record<string, number>;
  match: Match;
  current_frame: Frame;
  frame_log: FrameLogEntry[];
  frame_summary: FrameSummary[];
  score_keeper: "self" | "opp" | "ref" | "any";
  history_depth?: number;
  next_frame_confirmations?: string[];
};

export type FreeBallPot = {
  potted_ball: string;
  counts_as: string;
};

export type FrameLogFact =
  | {
      kind: "visit_summary";
      player_key: string;
      history_ids: string[];
      shot_count: number;
      potted_balls: string[];
      scored_balls: string[];
      free_ball_pots: FreeBallPot[];
      break_points: number;
      foul_points: number;
      result: "in_progress" | "ended" | "foul" | "frame_won";
    }
  | {
      kind: "shot_result";
      player_key: string;
      result: string;
      potted_balls: string[];
      scored_balls: string[];
      free_ball_pots: FreeBallPot[];
      break_points: number;
      foul_points: number;
      winner_key: string | null;
      points_awarded_to_player_key?: string;
    }
  | {
      kind: "summary_break";
      player_key: string;
      result: string;
      break_points: number;
      foul_points: number;
      composition_status: "missing" | "resolved" | "skipped";
      composition_suggestions?: SummaryBreakCompositionSuggestion[];
    }
  | {
      kind: "free_ball_nomination";
      player_key: string;
      nominated_colour: string;
      result: string;
    }
  | {
      kind: "pass_shot" | "reset_shot";
      player_key: string;
      result: string;
    }
  | {
      kind: "break_off" | "turn_started";
      player_key: string;
      result: "in_progress";
    };

export type FrameLogShot = {
  history_id: string;
  action: string;
  potted_balls: string[];
  scored_balls: string[];
  free_ball_pots: FreeBallPot[];
  break_points: number;
  foul_points: number;
  composition_status?: "missing" | "resolved" | "skipped";
  composition_suggestions?: SummaryBreakCompositionSuggestion[];
  resolved_composition?: string[];
  facts: FrameLogFact[];
};

export type SummaryBreakCompositionSuggestion = {
  id: string;
  label: string;
  balls: string[];
};

export type FrameLogEntry = {
  id: string;
  type: "visit";
  player_key: string;
  player_name: string;
  history_ids: string[];
  shots?: FrameLogShot[];
  potted_balls: string[];
  scored_balls: string[];
  free_ball_pots: FreeBallPot[];
  shot_count: number;
  break_points: number;
  foul_points: number;
  result: "in_progress" | "ended" | "foul" | "frame_won";
  facts: FrameLogFact[];
};

export type FrameSummary = {
  player_key: string;
  score: number;
  result: "won" | "lost" | "drawn";
  visits: number;
  highest_break: number;
  foul_points_conceded: number;
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

export type FreeBallState = {
  nominated_colour: string;
  object_ball: string;
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
  points_remaining: number | null;
  previously_fouled?: boolean;
  reds_remaining: number | null;
  colours_on_table: Record<string, boolean>;
  object_ball: string;
  free_ball: FreeBallState | null;
  points_gap: number;
  snookers_required: number | null;
  detail_level?: "shot_by_shot" | "partially_detailed";
  has_summary_entries?: boolean;
  has_unresolved_compositions?: boolean;
  has_unresolved_table_state?: boolean;
  unresolved_summary_entry_ids?: string[];
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
  action_id?: string;
  action: "pass_shot";
  data: Record<string, never>;
};

export type RoomClientDeclareFreeBallAction = {
  action_id?: string;
  action: "declare_free_ball";
  data: {
    nominated_colour: string;
  };
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

export type RoomClientLogBreakAction = {
  action_id?: string;
  action: "log_break";
  data: {
    points: number;
    foul: number;
  };
};

export type RoomClientResolveBreakCompositionAction = {
  action_id?: string;
  action: "resolve_break_composition";
  data: {
    entry_id: string;
    suggestion_id: string;
  };
};

export type RoomClientAction =
  | RoomClientShotAction
  | RoomClientUndoAction
  | RoomClientPassShotAction
  | RoomClientDeclareFreeBallAction
  | RoomClientConcedeAction
  | RoomClientNextFrameAction
  | RoomClientLogBreakAction
  | RoomClientResolveBreakCompositionAction;
