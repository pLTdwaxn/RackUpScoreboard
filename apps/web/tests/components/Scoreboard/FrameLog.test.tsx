import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FrameLog from "@/components/Scoreboard/FrameLog";
import BallComposition from "@/components/Scoreboard/FrameLog/BallComposition";
import LogEntry from "@/components/Scoreboard/FrameLog/LogEntry";
import UndoSlot from "@/components/Scoreboard/FrameLog/UndoSlot";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import { CompositionFilterCounts } from "@/components/Scoreboard/summaryBreakCompositionFilters";
import { FrameLogEntry, Player } from "@/types";

const socketMock = vi.hoisted(() => ({
  game: vi.fn(),
  actions: vi.fn(),
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomGame: socketMock.game,
  useMatchroomActions: socketMock.actions,
}));

const entry: FrameLogEntry = {
  id: "entry-1",
  type: "visit",
  player_key: "p1",
  player_name: "Ada Lovelace",
  history_ids: ["h1"],
  shots: [
    {
      history_id: "h1",
      action: "shot",
      potted_balls: ["red"],
      scored_balls: ["red"],
      free_ball_pots: [],
      break_points: 1,
      foul_points: 0,
      facts: [
        {
          kind: "shot_result",
          player_key: "p1",
          result: "scoring",
          potted_balls: ["red"],
          scored_balls: ["red"],
          free_ball_pots: [],
          break_points: 1,
          foul_points: 0,
          winner_key: null,
        },
      ],
    },
  ],
  potted_balls: ["red", "red", "black"],
  scored_balls: ["red", "red", "black"],
  free_ball_pots: [],
  shot_count: 1,
  break_points: 9,
  foul_points: 0,
  result: "ended",
  facts: [
    {
      kind: "visit_summary",
      player_key: "p1",
      history_ids: ["h1"],
      shot_count: 1,
      potted_balls: ["red", "red", "black"],
      scored_balls: ["red", "red", "black"],
      free_ball_pots: [],
      break_points: 9,
      foul_points: 0,
      result: "ended",
    },
  ],
};

const players: Player[] = [
  {
    session_key: "p1",
    name: "Ada Lovelace",
    type: "anonymous",
    match_score: 0,
    current_frame_score: 0,
    highest_break: null,
  },
  {
    session_key: "p2",
    name: "Grace Hopper",
    type: "anonymous",
    match_score: 0,
    current_frame_score: 0,
    highest_break: null,
  },
];

function ControlledLogEntry({
  controlledEntry = entry,
  onResolveBreakComposition = vi.fn(),
  compositionFilterCounts,
}: {
  controlledEntry?: FrameLogEntry;
  onResolveBreakComposition?: (entryId: string, suggestionId: string) => void;
  compositionFilterCounts?: CompositionFilterCounts;
}) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  return (
    <LogEntry
      entry={controlledEntry}
      canUndo
      onUndo={vi.fn()}
      onResolveBreakComposition={onResolveBreakComposition}
      compositionFilterCounts={compositionFilterCounts}
      players={players}
      isExpanded={controlledEntry.id === expandedEntryId}
      onExpandedChange={(isExpanded) =>
        setExpandedEntryId(isExpanded ? controlledEntry.id : null)
      }
    />
  );
}

function ballTokenLabels() {
  return Array.from(document.querySelectorAll("[aria-label]"))
    .map((element) => element.getAttribute("aria-label"))
    .filter((label): label is string => Boolean(label));
}

describe("FrameLog", () => {
  afterEach(() => {
    cleanup();
    socketMock.game.mockReset();
    socketMock.actions.mockReset();
  });

  it("renders entries and allows undo on the latest unfinished entry", () => {
    const sendAction = vi.fn();
    socketMock.game.mockReturnValue({
      players,
      gameState: {
        frame_log: [entry],
        current_frame: {
          ...DEFAULT_FRAME,
          status: "active",
        },
      },
    });
    socketMock.actions.mockReturnValue({ sendAction });

    render(<FrameLog />);

    expect(
      screen.getByLabelText("Ada Lovelace: break 9"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Collapse frame log entry details" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    );

    expect(sendAction).toHaveBeenCalledWith({ action: "undo", data: {} });
  });

  it("keeps only one log entry expanded at a time", () => {
    const secondEntry: FrameLogEntry = {
      ...entry,
      id: "entry-2",
      history_ids: ["h2"],
      shots: [
        {
          ...entry.shots![0],
          history_id: "h2",
          potted_balls: ["brown"],
          scored_balls: ["brown"],
          break_points: 4,
          facts: [
            {
              kind: "shot_result",
              player_key: "p1",
              result: "scoring",
              potted_balls: ["brown"],
              scored_balls: ["brown"],
              free_ball_pots: [],
              break_points: 4,
              foul_points: 0,
              winner_key: null,
            },
          ],
        },
      ],
      potted_balls: ["brown"],
      scored_balls: ["brown"],
      break_points: 4,
      facts: [
        {
          kind: "visit_summary",
          player_key: "p1",
          history_ids: ["h2"],
          shot_count: 1,
          potted_balls: ["brown"],
          scored_balls: ["brown"],
          free_ball_pots: [],
          break_points: 4,
          foul_points: 0,
          result: "ended",
        },
      ],
    };
    socketMock.game.mockReturnValue({
      players,
      gameState: {
        frame_log: [entry, secondEntry],
        current_frame: {
          ...DEFAULT_FRAME,
          status: "active",
        },
      },
    });
    socketMock.actions.mockReturnValue({ sendAction: vi.fn() });

    render(<FrameLog />);

    expect(
      screen.queryByText("Ada Lovelace potted a red."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Ada Lovelace: break 4"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );
    expect(screen.getByLabelText("Ada Lovelace potted a red.")).toBeInTheDocument();
    expect(
      screen.queryByText("Ada Lovelace potted the brown."),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );
    expect(
      screen.queryByText("Ada Lovelace potted a red."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Ada Lovelace: break 4"),
    ).toBeInTheDocument();
  });

  it("keeps undo on the latest history-backed entry when a synthetic marker is latest", () => {
    const sendAction = vi.fn();
    const turnMarker: FrameLogEntry = {
      ...entry,
      id: "turn:h1:p2",
      player_key: "p2",
      player_name: "Grace Hopper",
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
    };
    socketMock.game.mockReturnValue({
      players,
      gameState: {
        frame_log: [entry, turnMarker],
        current_frame: {
          ...DEFAULT_FRAME,
          status: "active",
        },
      },
    });
    socketMock.actions.mockReturnValue({ sendAction });

    render(<FrameLog />);

    const undoButtons = screen.getAllByRole("button", {
      name: "Undo latest frame log action",
    });
    const enabledUndoButtons = undoButtons.filter(
      (button) => !(button as HTMLButtonElement).disabled,
    );

    expect(screen.getByLabelText("Grace Hopper: new turn")).toBeInTheDocument();
    expect(enabledUndoButtons).toHaveLength(1);
    fireEvent.click(enabledUndoButtons[0]);
    expect(sendAction).toHaveBeenCalledWith({ action: "undo", data: {} });
  });

  it("highlights unresolved summary break entries and renders composition suggestions", () => {
    const onResolveBreakComposition = vi.fn();
    const unresolvedEntry: FrameLogEntry = {
      ...entry,
      id: "summary-1",
      history_ids: ["h-summary"],
      shots: [
        {
          history_id: "h-summary",
          action: "log_break",
          potted_balls: [],
          scored_balls: [],
          free_ball_pots: [],
          break_points: 35,
          foul_points: 4,
          composition_status: "missing",
          composition_suggestions: [
            {
              id: "suggestion_1",
              label: "5 reds, 1 yellow, 4 blacks",
              balls: [
                "red",
                "black",
                "red",
                "black",
                "red",
                "black",
                "red",
                "black",
                "red",
                "yellow",
              ],
            },
            {
              id: "suggestion_2",
              label: "5 reds, 5 pinks",
              balls: [
                "red",
                "pink",
                "red",
                "pink",
                "red",
                "pink",
                "red",
                "pink",
                "red",
                "pink",
              ],
            },
            {
              id: "suggestion_3",
              label: "5 reds, 1 yellow, 1 pink, 3 blacks",
              balls: [
                "red",
                "black",
                "red",
                "black",
                "red",
                "black",
                "red",
                "pink",
                "red",
                "yellow",
              ],
            },
            {
              id: "suggestion_4",
              label: "5 reds, 2 yellows, 3 blacks",
              balls: [
                "red",
                "black",
                "red",
                "black",
                "red",
                "black",
                "red",
                "yellow",
                "red",
                "yellow",
              ],
            },
          ],
          facts: [
            {
              kind: "summary_break",
              player_key: "p1",
              result: "summary_break",
              break_points: 35,
              foul_points: 4,
              composition_status: "missing",
              composition_suggestions: [
                {
                  id: "suggestion_1",
                  label: "5 reds, 1 yellow, 4 blacks",
                  balls: [
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "yellow",
                  ],
                },
                {
                  id: "suggestion_2",
                  label: "5 reds, 5 pinks",
                  balls: [
                    "red",
                    "pink",
                    "red",
                    "pink",
                    "red",
                    "pink",
                    "red",
                    "pink",
                    "red",
                    "pink",
                  ],
                },
                {
                  id: "suggestion_3",
                  label: "5 reds, 1 yellow, 1 pink, 3 blacks",
                  balls: [
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "pink",
                    "red",
                    "yellow",
                  ],
                },
                {
                  id: "suggestion_4",
                  label: "5 reds, 2 yellows, 3 blacks",
                  balls: [
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "black",
                    "red",
                    "yellow",
                    "red",
                    "yellow",
                  ],
                },
              ],
            },
          ],
        },
      ],
      potted_balls: [],
      scored_balls: [],
      free_ball_pots: [],
      break_points: 35,
      foul_points: 4,
      facts: [
        {
          kind: "visit_summary",
          player_key: "p1",
          history_ids: ["h-summary"],
          shot_count: 1,
          potted_balls: [],
          scored_balls: [],
          free_ball_pots: [],
          break_points: 35,
          foul_points: 4,
          result: "foul",
        },
      ],
    };

    render(
      <ControlledLogEntry
        controlledEntry={unresolvedEntry}
        onResolveBreakComposition={onResolveBreakComposition}
      />,
    );

    expect(
      screen.getByLabelText("Ada Lovelace: break 35, foul 4").closest("li"),
    ).toHaveAttribute(
      "data-unresolved-summary-break",
      "true",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(
      screen.getByRole("listbox", {
        name: "Summary break composition suggestions",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: /5 reds, 1 yellow, 4 blacks/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: /5 reds, 5 pinks/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: /5 reds, 1 yellow, 1 pink, 3 blacks/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: /5 reds, 2 yellows, 3 blacks/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("5 reds, 1 yellow, 4 blacks"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("5 red")).toHaveLength(4);
    expect(screen.getAllByLabelText("yellow")).toHaveLength(2);
    expect(screen.getByLabelText("2 yellow")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "yellow suggestion filter",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("option", {
        name: /5 reds, 1 yellow, 4 blacks/,
      }),
    );

    expect(onResolveBreakComposition).toHaveBeenCalledWith("h-summary", "suggestion_1");
  });
});

describe("FrameLog parts", () => {
  afterEach(cleanup);

  it("groups potted reds and sequential colours", () => {
    render(
      <BallComposition
        entryId="entry-1"
        pottedBalls={["red", "red", "black", "black", "pink"]}
      />,
    );

    expect(screen.getByLabelText("2 red")).toBeInTheDocument();
    expect(screen.getByLabelText("2 black")).toBeInTheDocument();
    expect(screen.getByLabelText("pink")).toBeInTheDocument();
    expect(screen.getByLabelText("2 red")).toHaveClass("bg-red-500");
  });

  it("renders a nominated free ball as one physical ball with an effective-colour ring", () => {
    render(
      <BallComposition
        entryId="entry-1"
        pottedBalls={["blue"]}
        freeBallPots={[{ potted_ball: "blue", counts_as: "red" }]}
      />,
    );

    const freeBall = screen.getByLabelText("blue counts as red");
    expect(freeBall).toHaveClass("bg-red-500");
    expect(freeBall.firstElementChild).toHaveClass("bg-blue-500");
    expect(screen.queryByLabelText("red")).not.toBeInTheDocument();
  });

  it("preserves composition order around free balls", () => {
    render(
      <BallComposition
        entryId="entry-1"
        pottedBalls={["blue", "red"]}
        freeBallPots={[{ potted_ball: "blue", counts_as: "red" }]}
      />,
    );

    expect(ballTokenLabels()).toEqual(["blue counts as red", "red"]);
  });

  it("groups actual reds and successive colours after a substituted red", () => {
    render(
      <BallComposition
        entryId="entry-1"
        pottedBalls={[
          "blue",
          "red",
          "red",
          "black",
          "black",
          "pink",
          "black",
          "black",
          "black",
        ]}
        freeBallPots={[{ potted_ball: "blue", counts_as: "red" }]}
      />,
    );

    expect(ballTokenLabels()).toEqual([
      "blue counts as red",
      "2 red",
      "2 black",
      "pink",
      "3 black",
    ]);
  });

  it("keeps later normal pots of the same colour as a substituted red grouped normally", () => {
    render(
      <BallComposition
        entryId="entry-1"
        pottedBalls={["green", "green", "red", "green", "red", "green"]}
        freeBallPots={[{ potted_ball: "green", counts_as: "red" }]}
      />,
    );

    expect(ballTokenLabels()).toEqual([
      "green counts as red",
      "2 red",
      "3 green",
    ]);
  });

  it("renders a log entry and calls undo", () => {
    const onUndo = vi.fn();

    render(
      <LogEntry
        entry={entry}
        canUndo
        onUndo={onUndo}
      />,
    );

    expect(
      screen.getByLabelText("Ada Lovelace: break 9"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    );
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("renders fact messages with the current player name", () => {
    render(
      <LogEntry
        entry={{ ...entry, player_name: "Legacy Ada" }}
        canUndo
        onUndo={vi.fn()}
        players={players}
      />,
    );

    expect(screen.getByLabelText("Ada Lovelace: break 9")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toHaveClass("player-theme-red");
    expect(screen.queryByLabelText("Legacy Ada: break 9")).not.toBeInTheDocument();
  });

  it("renders a new turn marker from facts", () => {
    render(
      <LogEntry
        entry={{
          ...entry,
          id: "turn:h1:p2",
          player_key: "p2",
          player_name: "Grace Hopper",
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
        }}
        canUndo
        onUndo={vi.fn()}
        players={players}
      />,
    );

    expect(screen.getByLabelText("Grace Hopper: new turn")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toHaveClass("player-theme-blue");
  });

  it("renders a break-off marker from facts", () => {
    render(
      <LogEntry
        entry={{
          ...entry,
          id: "break:frame-1:p1",
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
              kind: "break_off",
              player_key: "p1",
              result: "in_progress",
            },
          ],
        }}
        canUndo={false}
        onUndo={vi.fn()}
        players={players}
      />,
    );

    expect(screen.getByLabelText("Ada Lovelace to break off.")).toBeInTheDocument();
  });

  it("colours ball names in expanded shot messages", () => {
    render(<ControlledLogEntry />);

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(screen.getByText("red")).toHaveClass("text-red-500");
  });

  it("colours physical and effective balls in free-ball shot messages", () => {
    render(
      <ControlledLogEntry
        controlledEntry={{
          ...entry,
          shots: [
            {
              ...entry.shots![0],
              potted_balls: ["green"],
              scored_balls: ["red"],
              free_ball_pots: [{ potted_ball: "green", counts_as: "red" }],
              facts: [
                {
                  kind: "shot_result",
                  player_key: "p1",
                  result: "scoring",
                  potted_balls: ["green"],
                  scored_balls: ["red"],
                  free_ball_pots: [
                    { potted_ball: "green", counts_as: "red" },
                  ],
                  break_points: 1,
                  foul_points: 0,
                  winner_key: null,
                },
              ],
            },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(screen.getByText("green")).toHaveClass("text-green-600");
    expect(screen.getByText("red")).toHaveClass("text-red-500");
    expect(
      screen.getByLabelText("Ada Lovelace potted the green as a red."),
    ).toBeInTheDocument();
  });

  it("renders no-pot shot copy without implying a break score", () => {
    render(
      <ControlledLogEntry
        controlledEntry={{
          ...entry,
          shots: [
            {
              ...entry.shots![0],
              potted_balls: [],
              scored_balls: [],
              break_points: 0,
              facts: [
                {
                  kind: "shot_result",
                  player_key: "p1",
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
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(
      screen.getByLabelText("Ada Lovelace played a shot. No pot."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Ada Lovelace did not score.")).not.toBeInTheDocument();
  });

  it("does not expand when undo is pressed", () => {
    const onUndo = vi.fn();

    render(
      <LogEntry
        entry={entry}
        canUndo
        onUndo={onUndo}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    );

    expect(onUndo).toHaveBeenCalledOnce();
    expect(
      screen.queryByText("Ada Lovelace potted a red."),
    ).not.toBeInTheDocument();
  });

  it("expands and collapses log entry details", () => {
    render(<ControlledLogEntry />);

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(
      screen.getByRole("button", { name: "Collapse frame log entry details" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ada Lovelace potted a red.")).toBeInTheDocument();
  });

  it("highlights the last expanded shot message", () => {
    render(
      <ControlledLogEntry
        controlledEntry={{
          ...entry,
          shots: [
            entry.shots![0],
            {
              ...entry.shots![0],
              history_id: "h2",
              potted_balls: ["black"],
              scored_balls: ["black"],
              break_points: 7,
              facts: [
                {
                  kind: "shot_result",
                  player_key: "p1",
                  result: "scoring",
                  potted_balls: ["black"],
                  scored_balls: ["black"],
                  free_ball_pots: [],
                  break_points: 7,
                  foul_points: 0,
                  winner_key: null,
                },
              ],
            },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(
      screen.getByLabelText("Ada Lovelace potted a red.").closest("li"),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByLabelText("Ada Lovelace potted the black.").closest("li"),
    ).toHaveAttribute("aria-current", "true");
  });

  it("falls back to shot count when expanded details are unavailable", () => {
    render(<ControlledLogEntry controlledEntry={{ ...entry, shots: undefined }} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(screen.getByText("1 shot")).toBeInTheDocument();
  });

  it("keeps undo unavailable when not allowed", () => {
    render(<UndoSlot canUndo={false} onUndo={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    ).toBeDisabled();
  });
});
