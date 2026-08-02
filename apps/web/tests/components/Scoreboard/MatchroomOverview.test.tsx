import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import { Match } from "@/types";

const match: Match = {
  id: "match-1",
  name: "Practice",
  frames_to_win: 3,
  match_importance: "Practice Match",
  highest_break: null,
};

describe("MatchroomOverview", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows waiting text until the room is ready", () => {
    render(
      <MatchroomOverview
        roomReady={false}
        matchroomId="room-1"
        match={null}
      />,
    );

    expect(screen.getByText("Waiting for Opponent...")).toBeInTheDocument();
  });

  it("opens match details", () => {
    render(
      <MatchroomOverview
        roomReady
        matchroomId="room 1"
        clubId="club-1"
        match={match}
      />,
    );

    expect(screen.getByText("Best of 5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Best of 5/ }));

    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("Club")).toBeInTheDocument();
    expect(screen.getByText("club-1")).toBeInTheDocument();
    expect(screen.getByText("Importance")).toBeInTheDocument();
    expect(screen.getByText("Practice Match")).toBeInTheDocument();
    expect(screen.getByText("Winning Condition")).toBeInTheDocument();
    expect(screen.queryByText("room 1")).not.toBeInTheDocument();
  });
});
