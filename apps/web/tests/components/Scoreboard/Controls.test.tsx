import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Controls from "@/components/Scoreboard/Controls";
import { DEFAULT_FRAME } from "@/lib/viewModel";

const hookMock = vi.hoisted(() => ({
  players: vi.fn(),
  frame: vi.fn(),
  actions: vi.fn(),
}));

vi.mock("@/hooks/useMatchroomPlayers", () => ({
  useMatchroomPlayers: hookMock.players,
}));

vi.mock("@/hooks/useMatchroomFrame", () => ({
  useMatchroomFrame: hookMock.frame,
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomActions: hookMock.actions,
}));

const activeFrame = {
  ...DEFAULT_FRAME,
  status: "active" as const,
  current_turn: "p1",
  object_ball: "red",
  reds_remaining: 15,
  scores: {
    p1: 0,
    p2: 0,
  },
};

function arrangeControls({
  frame = activeFrame,
  currentPlayerKey = "p1",
  scoreKeeper = "self",
  nextFrameConfirmations = [],
  sendAction = vi.fn(),
}: {
  frame?: typeof activeFrame;
  currentPlayerKey?: string;
  scoreKeeper?: "self" | "opp" | "ref" | "any";
  nextFrameConfirmations?: string[];
  sendAction?: ReturnType<typeof vi.fn>;
} = {}) {
  hookMock.players.mockReturnValue({ currentPlayerKey });
  hookMock.frame.mockReturnValue({
    hasFrame: true,
    frame,
    scoreKeeper,
    nextFrameConfirmations,
  });
  hookMock.actions.mockReturnValue({ sendAction });
  render(<Controls />);
  return { sendAction };
}

function buttons() {
  return screen.getAllByRole("button", { hidden: true });
}

describe("Controls", () => {
  afterEach(() => {
    cleanup();
    hookMock.players.mockReset();
    hookMock.frame.mockReset();
    hookMock.actions.mockReset();
  });

  it("renders nothing before a frame exists", () => {
    hookMock.players.mockReturnValue({ currentPlayerKey: "p1" });
    hookMock.frame.mockReturnValue({
      hasFrame: false,
      frame: DEFAULT_FRAME,
      scoreKeeper: "self",
      nextFrameConfirmations: [],
    });
    hookMock.actions.mockReturnValue({ sendAction: vi.fn() });

    const { container } = render(<Controls />);

    expect(container).toBeEmptyDOMElement();
  });

  it("sends a legal single-ball shot from simple controls", () => {
    const sendAction = vi.fn();
    arrangeControls({ sendAction });

    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["red"],
        foul: 0,
      },
    });
  });

  it("shows finished frame controls", () => {
    const sendAction = vi.fn();
    arrangeControls({
      sendAction,
      frame: {
        ...activeFrame,
        status: "finished",
        winner_key: "p1",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Start Next Frame" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "next_frame",
      data: {},
    });
  });

  it("enters advanced composer for an illegal simple ball and submits it", () => {
    const sendAction = vi.fn();
    arrangeControls({ sendAction });

    fireEvent.click(screen.getByRole("button", { name: "blue" }));

    expect(screen.getByText("Pot 1 blue")).toBeInTheDocument();
    expect(screen.getByText("FOUL")).toBeInTheDocument();

    fireEvent.click(buttons().at(-2)!);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["blue"],
        foul: 0,
      },
    });
    expect(screen.getByText("Scorekeeping for your turn")).toBeInTheDocument();
  });

  it("declares a foul on a selected ball", () => {
    const sendAction = vi.fn();
    arrangeControls({ sendAction });

    fireEvent.click(buttons()[11]);
    expect(screen.getByText("Tap the ball fouled on")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "black" }));
    expect(screen.getByText("Foul on black")).toBeInTheDocument();

    fireEvent.click(buttons().at(-2)!);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: [],
        foul: 7,
      },
    });
  });

  it("uses previous-foul options for pass shot and free-ball nomination", () => {
    const sendAction = vi.fn();
    arrangeControls({
      sendAction,
      frame: {
        ...activeFrame,
        previously_fouled: true,
      },
    });

    fireEvent.click(buttons()[9]);
    expect(sendAction).toHaveBeenCalledWith({
      action: "pass_shot",
      data: {},
    });

    fireEvent.click(buttons()[10]);
    expect(screen.getByText("Nominate the free ball")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "blue" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "declare_free_ball",
      data: {
        nominated_colour: "blue",
      },
    });
  });

  it("infers foul points for illegal free-ball composer shots", () => {
    const sendAction = vi.fn();
    arrangeControls({
      sendAction,
      frame: {
        ...activeFrame,
        free_ball: {
          nominated_colour: "blue",
          object_ball: "red",
        },
      },
    });

    fireEvent.click(buttons().at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: "black" }));
    expect(screen.getByText("FOUL 7")).toBeInTheDocument();
    fireEvent.click(buttons().at(-2)!);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["black"],
        foul: 7,
      },
    });
  });

  it("opens and confirms the concede dialog", () => {
    const sendAction = vi.fn();
    arrangeControls({ sendAction });

    fireEvent.click(buttons()[7]);
    fireEvent.click(screen.getByRole("button", { name: "Concede" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "concede",
      data: {},
    });
  });
});
