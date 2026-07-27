import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FrameLog from "@/components/Scoreboard/FrameLog";
import BallComposition from "@/components/Scoreboard/FrameLog/BallComposition";
import LogEntry from "@/components/Scoreboard/FrameLog/LogEntry";
import UndoSlot from "@/components/Scoreboard/FrameLog/UndoSlot";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import { FrameLogEntry } from "@/types";

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
      message: "Ada potted a red.",
    },
  ],
  potted_balls: ["red", "red", "black"],
  scored_balls: ["red", "red", "black"],
  free_ball_pots: [],
  shot_count: 1,
  break_points: 9,
  foul_points: 0,
  result: "ended",
  message: "Ada potted 2 reds and black",
};

function ControlledLogEntry({
  controlledEntry = entry,
}: {
  controlledEntry?: FrameLogEntry;
}) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  return (
    <LogEntry
      entry={controlledEntry}
      canUndo
      onUndo={vi.fn()}
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
      screen.getByText("Ada potted 2 reds and black"),
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
          message: "Ada potted the brown.",
        },
      ],
      message: "Ada potted the brown",
    };
    socketMock.game.mockReturnValue({
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

    expect(screen.queryByText("Ada potted a red.")).not.toBeInTheDocument();
    expect(screen.getByText("Ada potted the brown.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );
    expect(screen.getByText("Ada potted a red.")).toBeInTheDocument();
    expect(screen.queryByText("Ada potted the brown.")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );
    expect(screen.queryByText("Ada potted a red.")).not.toBeInTheDocument();
    expect(screen.getByText("Ada potted the brown.")).toBeInTheDocument();
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

    expect(screen.getByText("Ada potted 2 reds and black")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    );
    expect(onUndo).toHaveBeenCalledOnce();
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
    expect(screen.queryByText("Ada potted a red.")).not.toBeInTheDocument();
  });

  it("expands and collapses log entry details", () => {
    render(<ControlledLogEntry />);

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(
      screen.getByRole("button", { name: "Collapse frame log entry details" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada potted a red.")).toBeInTheDocument();
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
              message: "Ada potted the black.",
            },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Expand frame log entry details" }),
    );

    expect(screen.getByText("Ada potted a red.").closest("li")).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("Ada potted the black.").closest("li")).toHaveAttribute(
      "aria-current",
      "true",
    );
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
