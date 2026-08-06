import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PlayerCard from "@/components/Scoreboard/shared/PlayerCard";
import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import PlayerName from "@/components/Scoreboard/shared/PlayerName";
import { Player } from "@/types";

const player: Player = {
  session_key: "p1",
  name: "Ada Lovelace",
  type: "anonymous",
  match_score: 1,
  current_frame_score: 32,
  highest_break: 24,
};

describe("player display components", () => {
  afterEach(cleanup);

  it("renders player name and initials in a card", () => {
    render(<PlayerCard player={player} theme="red" />);

    expect(screen.getByText("Ada Lovelace")).toHaveClass("player-theme-red");
    const blendLayer = screen.getByText("AL").previousElementSibling;
    expect(blendLayer).toHaveAttribute("aria-hidden", "true");
    expect(blendLayer?.getAttribute("style")).toContain(
      "var(--player-avatar-background)",
    );
  });

  it("renders avatar fallback initials", () => {
    render(
      <PlayerAvatar
        avatarColor="#111"
        avatarColor2="#222"
        initials="AL"
        size="sm"
      />,
    );

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders player name in either direction", () => {
    render(<PlayerName player={player} reverseDirection={false} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
