import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ControlPanel from "@/components/Scoreboard/ControlPanel";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import type { Player } from "@/types";

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

function arrangeControlPanel({
  frame = activeFrame,
  currentPlayerKey = "p1",
  matchroomPlayers,
  scoreKeeper = "self",
  nextFrameConfirmations = [],
  sendAction = vi.fn(),
}: {
  frame?: typeof activeFrame;
  currentPlayerKey?: string;
  matchroomPlayers?: Player[];
  scoreKeeper?: "self" | "opp" | "ref" | "any";
  nextFrameConfirmations?: string[];
  sendAction?: ReturnType<typeof vi.fn>;
} = {}) {
  hookMock.players.mockReturnValue({
    currentPlayerKey,
    players: matchroomPlayers,
  });
  hookMock.frame.mockReturnValue({
    hasFrame: true,
    frame,
    scoreKeeper,
    nextFrameConfirmations,
  });
  hookMock.actions.mockReturnValue({ sendAction });
  render(<ControlPanel />);
  return { sendAction };
}

function buttons() {
  return screen.getAllByRole("button", { hidden: true });
}

describe("ControlPanel", () => {
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

    const { container } = render(<ControlPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it("sends a legal single-ball shot from simple controls", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({ sendAction });

    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["red"],
        foul: 0,
      },
    });
  });

  it("renders unknown reds as a question mark and allows red shots", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({
      sendAction,
      frame: {
        ...activeFrame,
        reds_remaining: null,
      },
    });

    const redButton = screen.getByRole("button", { name: "red" });

    expect(redButton).toHaveTextContent("?");

    fireEvent.click(redButton);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["red"],
        foul: 0,
      },
    });
  });

  it("toggles summary break number fields from simple controls", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({ matchroomPlayers: players, sendAction });

    fireEvent.click(
      screen.getByRole("button", { name: "Log break by number" }),
    );

    expect(
      screen.getByText("Manually logging the break for"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toHaveClass("player-theme-red");
    expect(screen.getByRole("textbox", { name: "Score" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Foul" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit logged break" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "red" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Increase score/ }));

    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "Foul" })).toHaveValue("0");
    expect(
      screen.getByRole("button", { name: "Submit logged break" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Submit logged break" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "log_break",
      data: {
        points: 1,
        foul: 0,
      },
    });
    expect(screen.getByRole("button", { name: "red" })).toBeInTheDocument();
  });

  it("restores the ball rail when summary break mode is toggled off", () => {
    arrangeControlPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Log break by number" }),
    );
    expect(
      screen.queryByRole("button", { name: "red" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Log break by number" }),
    );

    expect(screen.getByRole("button", { name: "red" })).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Score" }),
    ).not.toBeInTheDocument();
  });

  it("leaves summary break mode when the advanced composer opens", () => {
    arrangeControlPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Log break by number" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Advanced shot composer" }),
    );

    expect(screen.getByText("Tap the balls potted")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Score" }),
    ).not.toBeInTheDocument();
  });

  it("constrains summary break score and foul inputs", () => {
    arrangeControlPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Log break by number" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Score" }), {
      target: { value: "155" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Foul" }), {
      target: { value: "7" },
    });

    expect(
      screen.getByRole("button", { name: /Increase score/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Increase foul/ }),
    ).toBeDisabled();
  });

  it("shows the themed player at the table for self scorekeeping", () => {
    arrangeControlPanel({
      matchroomPlayers: players,
      scoreKeeper: "self",
    });

    expect(screen.getByText("Ada Lovelace")).toHaveClass("player-theme-red");
  });

  it("shows the themed player at the table for opponent scorekeeping", () => {
    arrangeControlPanel({
      currentPlayerKey: "p2",
      matchroomPlayers: players,
      scoreKeeper: "opp",
    });

    expect(screen.getByText("Ada Lovelace")).toHaveClass("player-theme-red");
    expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();
  });

  it("shows finished frame controls", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({
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
    arrangeControlPanel({ sendAction });

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
    arrangeControlPanel({ sendAction });

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

  it("declares a foul on a red without potting it", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({ sendAction });

    fireEvent.click(buttons()[11]);
    expect(screen.getByText("Tap the ball fouled on")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(screen.getByRole("button", { name: "red" })).toHaveTextContent("-");
    expect(screen.getByText("Foul on a red (no pot)")).toBeInTheDocument();
    expect(screen.getByText("FOUL 4")).toBeInTheDocument();
    expect(screen.queryByText("LEGAL")).not.toBeInTheDocument();

    fireEvent.click(buttons().at(-2)!);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: [],
        foul: 4,
      },
    });
  });

  it("declares a colour foul with reds potted", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({ sendAction });

    fireEvent.click(buttons()[11]);
    fireEvent.click(screen.getByRole("button", { name: "red" }));
    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(screen.getByRole("button", { name: "red" })).toHaveTextContent("1");
    expect(screen.getByText("Foul with 1 red potted")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(screen.getByRole("button", { name: "red" })).toHaveTextContent("2");
    expect(screen.getByText("Foul with 2 reds potted")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "black" }));

    expect(
      screen.getByText("Foul on black with 2 reds potted"),
    ).toBeInTheDocument();
    expect(screen.getByText("FOUL 7")).toBeInTheDocument();
    expect(screen.queryByText("LEGAL")).not.toBeInTheDocument();

    fireEvent.click(buttons().at(-2)!);

    expect(sendAction).toHaveBeenCalledWith({
      action: "shot",
      data: {
        potted_balls: ["red", "red"],
        foul: 7,
      },
    });
  });

  it("cycles selected reds back to none after the maximum count", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({
      sendAction,
      frame: {
        ...activeFrame,
        reds_remaining: 2,
      },
    });

    fireEvent.click(buttons().at(-1)!);

    const redButton = screen.getByRole("button", { name: "red" });
    fireEvent.click(redButton);
    expect(redButton).toHaveTextContent("1");

    fireEvent.click(redButton);
    expect(redButton).toHaveTextContent("2");

    fireEvent.click(redButton);
    expect(redButton).toHaveTextContent("");
    expect(screen.getByText("Tap the balls potted")).toBeInTheDocument();
  });

  it("uses previous-foul options for pass shot and free-ball nomination", () => {
    const sendAction = vi.fn();
    arrangeControlPanel({
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
    arrangeControlPanel({
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
    arrangeControlPanel({ sendAction });

    fireEvent.click(buttons()[7]);
    fireEvent.click(screen.getByRole("button", { name: "Concede" }));

    expect(sendAction).toHaveBeenCalledWith({
      action: "concede",
      data: {},
    });
  });
});
