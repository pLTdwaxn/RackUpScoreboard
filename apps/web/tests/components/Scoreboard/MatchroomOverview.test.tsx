import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import QRCode from "qrcode";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import { Match } from "@/types";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

const match: Match = {
  id: "match-1",
  name: "Practice",
  frames_to_win: null,
  match_importance: "Practice Match",
  highest_break: null,
};

describe("MatchroomOverview", () => {
  beforeEach(() => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue("data:image/png;base64,qr");
    window.history.pushState({}, "", "http://localhost:3000/");
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows waiting text until the room is ready", () => {
    render(
      <MatchroomOverview
        roomReady={false}
        matchroomId="room-1"
        match={null}
        resetRoom={vi.fn()}
      />,
    );

    expect(screen.getByText("Waiting for Opponent...")).toBeInTheDocument();
  });

  it("opens invite details and leaves the room", async () => {
    const resetRoom = vi.fn();

    render(
      <MatchroomOverview
        roomReady
        matchroomId="room 1"
        match={match}
        resetRoom={resetRoom}
      />,
    );

    expect(screen.getByText("Practice Match")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Practice Match/ }));

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "http://localhost:3000/matchroom/room%201",
        {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 256,
        },
      );
    });
    expect(screen.getByText("room 1")).toBeInTheDocument();
    expect(
      await screen.findByAltText("QR code for matchroom room 1"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Leave Room/ }));

    expect(resetRoom).toHaveBeenCalledOnce();
  });
});
