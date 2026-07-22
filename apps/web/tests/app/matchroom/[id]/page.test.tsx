import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MatchPage from "@/app/matchroom/[id]/page";

const matchroomSessionMock = vi.hoisted(() =>
  vi.fn(() => ({
    hydrated: true,
    hasRoomSession: false,
    readyToRenderRoom: false,
  })),
);

vi.mock("next/navigation", () => ({
  useParams: () => ({
    id: "room-1",
  }),
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomSession: matchroomSessionMock,
}));

vi.mock("@/components/Lobby", () => ({
  LobbyCard: ({ initialMatchroomId }: { initialMatchroomId?: string }) => (
    <section
      data-initial-matchroom-id={initialMatchroomId}
      data-testid="lobby-card"
    />
  ),
}));

vi.mock("@/components/Scoreboard/Scoreboard", () => ({
  default: () => <section data-testid="scoreboard" />,
}));

describe("Matchroom detail page", () => {
  afterEach(() => {
    cleanup();
    matchroomSessionMock.mockReset();
  });

  it("shows the join form when there is no room session", () => {
    matchroomSessionMock.mockReturnValue({
      hydrated: true,
      hasRoomSession: false,
      readyToRenderRoom: false,
    });

    render(<MatchPage />);

    expect(screen.getByTestId("lobby-card")).toHaveAttribute(
      "data-initial-matchroom-id",
      "room-1",
    );
  });

  it("shows a connecting state while waiting for the room", () => {
    matchroomSessionMock.mockReturnValue({
      hydrated: true,
      hasRoomSession: true,
      readyToRenderRoom: false,
    });

    render(<MatchPage />);

    expect(screen.getByText("Connecting to matchroom...")).toBeInTheDocument();
  });

  it("renders the scoreboard when the room is ready", () => {
    matchroomSessionMock.mockReturnValue({
      hydrated: true,
      hasRoomSession: true,
      readyToRenderRoom: true,
    });

    render(<MatchPage />);

    expect(screen.getByTestId("scoreboard")).toBeInTheDocument();
  });
});
