import { DEFAULT_FRAME, DEFAULT_MATCH } from "@/lib/viewModel";
import type {
  Frame,
  FrameLogEntry,
  FrameLogFact,
  FrameSummary,
  Match,
  Player,
  SummaryBreakCompositionSuggestion,
} from "@/types";

export const storyPlayers: Player[] = [
  {
    session_key: "p1",
    name: "Fermin",
    type: "anonymous",
    match_score: 1,
    current_frame_score: 35,
    highest_break: 20,
  },
  {
    session_key: "p2",
    name: "George",
    type: "anonymous",
    match_score: 0,
    current_frame_score: 0,
    highest_break: null,
  },
];

export const storyWaitingPlayer: Player = {
  session_key: "waiting-player",
  name: "Waiting",
  type: "placeholder",
  match_score: 0,
  current_frame_score: 0,
  highest_break: null,
};

export const storyFrame: Frame = {
  ...DEFAULT_FRAME,
  status: "active",
  current_turn: "p1",
  scores: {
    p1: 35,
    p2: 0,
  },
  current_break: 15,
  points_remaining: 107,
  points_gap: 35,
  snookers_required: 0,
};

export const storyPartiallyDetailedFrame: Frame = {
  ...storyFrame,
  reds_remaining: null,
  points_remaining: null,
  snookers_required: null,
  detail_level: "partially_detailed",
  has_summary_entries: true,
  has_unresolved_compositions: true,
  has_unresolved_table_state: true,
  unresolved_summary_entry_ids: ["visit-summary"],
};

export const storyMatch: Match = {
  ...DEFAULT_MATCH,
  id: "match-1",
  name: "Friday Ladder",
  frames_to_win: 3,
  match_importance: "Club Night",
  highest_break: 35,
};

export const summaryBreakSuggestions: SummaryBreakCompositionSuggestion[] = [
  {
    id: "suggestion-1",
    label: "3 reds, 2 blacks, pink",
    balls: ["red", "black", "red", "black", "red", "pink"],
  },
  {
    id: "suggestion-2",
    label: "4 reds, 2 blues, black",
    balls: ["red", "blue", "red", "blue", "red", "black", "red"],
  },
  {
    id: "suggestion-3",
    label: "5 reds, colours",
    balls: ["red", "pink", "red", "blue", "red", "brown", "red", "yellow", "red"],
  },
];

export const scoringShotFact: FrameLogFact = {
  kind: "shot_result",
  player_key: "p1",
  result: "scoring",
  potted_balls: ["red", "black"],
  scored_balls: ["red", "black"],
  free_ball_pots: [],
  break_points: 8,
  foul_points: 0,
  winner_key: null,
};

export const foulShotFact: FrameLogFact = {
  kind: "shot_result",
  player_key: "p2",
  result: "foul",
  potted_balls: ["red"],
  scored_balls: [],
  free_ball_pots: [],
  break_points: 0,
  foul_points: 4,
  winner_key: null,
  points_awarded_to_player_key: "p1",
};

export const summaryBreakFact: FrameLogFact = {
  kind: "summary_break",
  player_key: "p1",
  result: "summary_break",
  break_points: 15,
  foul_points: 0,
  composition_status: "missing",
  composition_suggestions: summaryBreakSuggestions,
};

export const visitSummaryFact: FrameLogFact = {
  kind: "visit_summary",
  player_key: "p1",
  history_ids: ["shot-1", "shot-2", "shot-3"],
  shot_count: 3,
  potted_balls: ["red", "black", "red", "pink"],
  scored_balls: ["red", "black", "red", "pink"],
  free_ball_pots: [],
  break_points: 20,
  foul_points: 0,
  result: "ended",
};

export const storyFrameLogEntries: FrameLogEntry[] = [
  {
    id: "visit-george-empty",
    type: "visit",
    player_key: "p2",
    player_name: "George",
    history_ids: ["shot-0"],
    shots: [
      {
        history_id: "shot-0",
        action: "shot",
        potted_balls: [],
        scored_balls: [],
        free_ball_pots: [],
        break_points: 0,
        foul_points: 0,
        facts: [
          {
            kind: "shot_result",
            player_key: "p2",
            result: "no_score",
            potted_balls: [],
            scored_balls: [],
            free_ball_pots: [],
            break_points: 0,
            foul_points: 0,
            winner_key: null,
          },
        ],
      },
    ],
    potted_balls: [],
    scored_balls: [],
    free_ball_pots: [],
    shot_count: 1,
    break_points: 0,
    foul_points: 0,
    result: "ended",
    facts: [
      {
        kind: "visit_summary",
        player_key: "p2",
        history_ids: ["shot-0"],
        shot_count: 1,
        potted_balls: [],
        scored_balls: [],
        free_ball_pots: [],
        break_points: 0,
        foul_points: 0,
        result: "ended",
      },
    ],
  },
  {
    id: "visit-fermin-break",
    type: "visit",
    player_key: "p1",
    player_name: "Fermin",
    history_ids: ["shot-1", "shot-2", "shot-3"],
    shots: [
      {
        history_id: "shot-1",
        action: "shot",
        potted_balls: ["red", "black"],
        scored_balls: ["red", "black"],
        free_ball_pots: [],
        break_points: 8,
        foul_points: 0,
        facts: [scoringShotFact],
      },
      {
        history_id: "shot-2",
        action: "shot",
        potted_balls: ["red", "pink"],
        scored_balls: ["red", "pink"],
        free_ball_pots: [],
        break_points: 7,
        foul_points: 0,
        facts: [
          {
            ...scoringShotFact,
            potted_balls: ["red", "pink"],
            scored_balls: ["red", "pink"],
            break_points: 7,
          },
        ],
      },
    ],
    potted_balls: ["red", "black", "red", "pink"],
    scored_balls: ["red", "black", "red", "pink"],
    free_ball_pots: [],
    shot_count: 2,
    break_points: 15,
    foul_points: 0,
    result: "ended",
    facts: [visitSummaryFact],
  },
  {
    id: "visit-summary",
    type: "visit",
    player_key: "p1",
    player_name: "Fermin",
    history_ids: ["summary-1"],
    shots: [
      {
        history_id: "summary-1",
        action: "log_break",
        potted_balls: [],
        scored_balls: [],
        free_ball_pots: [],
        break_points: 15,
        foul_points: 0,
        composition_status: "missing",
        composition_suggestions: summaryBreakSuggestions,
        facts: [summaryBreakFact],
      },
    ],
    potted_balls: [],
    scored_balls: [],
    free_ball_pots: [],
    shot_count: 1,
    break_points: 15,
    foul_points: 0,
    result: "ended",
    facts: [summaryBreakFact],
  },
  {
    id: "visit-george-current",
    type: "visit",
    player_key: "p2",
    player_name: "George",
    history_ids: [],
    shots: [],
    potted_balls: [],
    scored_balls: [],
    free_ball_pots: [],
    shot_count: 0,
    break_points: 0,
    foul_points: 0,
    result: "in_progress",
    facts: [
      {
        kind: "turn_started",
        player_key: "p2",
        result: "in_progress",
      },
    ],
  },
];

export const storyFrameSummary: FrameSummary[] = [
  {
    player_key: "p1",
    score: 35,
    result: "won",
    visits: 3,
    highest_break: 20,
    foul_points_conceded: 0,
  },
  {
    player_key: "p2",
    score: 12,
    result: "lost",
    visits: 4,
    highest_break: 8,
    foul_points_conceded: 4,
  },
];

export const noop = () => {};
