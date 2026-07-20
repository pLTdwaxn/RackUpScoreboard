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
