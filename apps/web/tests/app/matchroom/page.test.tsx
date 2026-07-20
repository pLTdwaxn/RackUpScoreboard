import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MatchroomLobbyPage from "@/app/matchroom/page";

vi.mock("@/components/Lobby", () => ({
  LobbyCard: () => <section data-testid="lobby-card" />,
}));

describe("Matchroom lobby page", () => {
  it("renders the lobby card workflow", () => {
    render(<MatchroomLobbyPage />);

    expect(screen.getByTestId("lobby-card")).toBeInTheDocument();
  });
});
