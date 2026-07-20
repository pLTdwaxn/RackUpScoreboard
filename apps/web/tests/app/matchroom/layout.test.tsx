import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MatchroomLayout from "@/app/matchroom/layout";

const providerMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useParams: () => ({
    id: "room-1",
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSocket", () => ({
  MatchroomProvider: ({
    matchroomId,
    children,
  }: {
    matchroomId: string;
    children: React.ReactNode;
  }) => {
    providerMock(matchroomId);
    return <section data-testid="matchroom-provider">{children}</section>;
  },
  useMatchroomGame: () => ({
    gameState: null,
  }),
  useMatchroomSession: () => ({
    matchroomId: "room-1",
  }),
}));

vi.mock("@/components/Scoreboard/MatchroomOverview", () => ({
  default: ({ matchroomId }: { matchroomId: string }) => (
    <div data-testid="matchroom-overview">{matchroomId}</div>
  ),
}));

vi.mock("@/components/SideDrawer/Menu", () => ({
  default: () => <button type="button">Menu</button>,
}));

vi.mock("@/components/ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

describe("Matchroom layout", () => {
  it("wraps children in the matchroom provider for the route room", () => {
    render(
      <MatchroomLayout>
        <div data-testid="page-content">Room content</div>
      </MatchroomLayout>,
    );

    expect(providerMock).toHaveBeenCalledWith("room-1");
    expect(screen.getByTestId("matchroom-provider")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toHaveTextContent(
      "Room content",
    );
    expect(screen.getByTestId("matchroom-overview")).toHaveTextContent(
      "room-1",
    );
  });
});
