import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FrameLog from "@/components/Scoreboard/FrameLog";
import BallComposition from "@/components/Scoreboard/FrameLog/BallComposition";
import LogEntry from "@/components/Scoreboard/FrameLog/LogEntry";
import UndoSlot from "@/components/Scoreboard/FrameLog/UndoSlot";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import { FrameLogEntry } from "@/types";

const socketMock = vi.hoisted(() => ({
  game: vi.fn(),
  session: vi.fn(),
  actions: vi.fn(),
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomGame: socketMock.game,
  useMatchroomSession: socketMock.session,
  useMatchroomActions: socketMock.actions,
}));

const entry: FrameLogEntry = {
  id: "entry-1",
  type: "visit",
  player_key: "p1",
  player_name: "Ada Lovelace",
  history_ids: ["h1"],
  potted_balls: ["red", "red", "black"],
  scored_balls: ["red", "red", "black"],
  free_ball_pots: [],
  shot_count: 1,
  break_points: 9,
  foul_points: 0,
  result: "ended",
  message: "Ada potted 2 reds and black",
};

describe("FrameLog", () => {
  afterEach(() => {
    cleanup();
    socketMock.game.mockReset();
    socketMock.session.mockReset();
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
    socketMock.session.mockReturnValue({ sessionKey: "p1" });
    socketMock.actions.mockReturnValue({ sendAction });

    render(<FrameLog />);

    expect(screen.getByText("Ada potted 2 reds and black")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    );

    expect(sendAction).toHaveBeenCalledWith({ action: "undo", data: {} });
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

    const tokens = screen.getAllByLabelText(/blue counts as red|red/);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toHaveAttribute("aria-label", "blue counts as red");
    expect(tokens[1]).toHaveAttribute("aria-label", "red");
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

    const tokens = screen.getAllByLabelText(
      /blue counts as red|2 red|2 black|pink|3 black/,
    );
    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toHaveAttribute("aria-label", "blue counts as red");
    expect(tokens[1]).toHaveAttribute("aria-label", "2 red");
    expect(tokens[2]).toHaveAttribute("aria-label", "2 black");
    expect(tokens[3]).toHaveAttribute("aria-label", "pink");
    expect(tokens[4]).toHaveAttribute("aria-label", "3 black");
  });

  it("renders a log entry and calls undo", () => {
    const onUndo = vi.fn();

    render(
      <LogEntry
        entry={entry}
        isCurrentUser
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

  it("keeps undo unavailable when not allowed", () => {
    render(<UndoSlot canUndo={false} onUndo={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Undo latest frame log action" }),
    ).toBeDisabled();
  });
});
