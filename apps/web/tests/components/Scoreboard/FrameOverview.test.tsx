import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FrameOverview, {
  FrameStats,
  ScoreCard,
} from "@/components/Scoreboard/FrameOverview";
import { DEFAULT_FRAME } from "@/lib/viewModel";
import { Player } from "@/types";

const frameHookMock = vi.hoisted(() => vi.fn());
const playersHookMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useMatchroomFrame", () => ({
  useMatchroomFrame: frameHookMock,
}));

vi.mock("@/hooks/useMatchroomPlayers", () => ({
  useMatchroomPlayers: playersHookMock,
}));

const ada: Player = {
  session_key: "p1",
  name: "Ada",
  type: "anonymous",
  match_score: 1,
  current_frame_score: 32,
  highest_break: 24,
};

const grace: Player = {
  session_key: "p2",
  name: "Grace",
  type: "anonymous",
  match_score: 0,
  current_frame_score: 18,
  highest_break: null,
};

const frame = {
  ...DEFAULT_FRAME,
  points_remaining: 67,
  points_gap: 14,
  snookers_required: 2,
  scores: {
    p1: 32,
    p2: 18,
  },
};

describe("FrameOverview", () => {
  afterEach(() => {
    cleanup();
    frameHookMock.mockReset();
    playersHookMock.mockReset();
  });

  it("renders nothing without a frame", () => {
    playersHookMock.mockReturnValue({ me: ada, opponent: grace });
    frameHookMock.mockReturnValue({ hasFrame: false });

    const { container } = render(<FrameOverview />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders stats and both player score cards", () => {
    playersHookMock.mockReturnValue({ me: ada, opponent: grace });
    frameHookMock.mockReturnValue({
      hasFrame: true,
      frame,
      isMyTurn: true,
      isOpponentTurn: false,
      winningPlayerKey: "p1",
    });

    render(<FrameOverview />);

    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("Gap")).toBeInTheDocument();
    expect(screen.getByText("Snks Needed")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByLabelText("Match score 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Match score 0")).toBeInTheDocument();
  });

  it("renders a waiting placeholder for player 2 before an opponent joins", () => {
    playersHookMock.mockReturnValue({ me: ada, opponent: undefined });
    frameHookMock.mockReturnValue({
      hasFrame: true,
      frame,
      isMyTurn: true,
      isOpponentTurn: false,
      winningPlayerKey: null,
    });

    render(<FrameOverview />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});

describe("FrameOverview parts", () => {
  afterEach(cleanup);

  it("renders frame stat values", () => {
    render(<FrameStats frame={frame} />);

    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders unknown table-derived stats as question marks", () => {
    render(
      <FrameStats
        frame={{
          ...frame,
          points_remaining: null,
          snookers_required: null,
          has_unresolved_table_state: true,
        }}
      />,
    );

    expect(screen.getAllByText("?")).toHaveLength(2);
  });

  it("renders score and player details", () => {
    render(
      <ScoreCard
        player={ada}
        frame={frame}
        currentTurn
        isFrameWinner
      />,
    );

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Ada").closest(".winner-card-glow")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByLabelText("Match score 1")).toBeInTheDocument();
  });
});
