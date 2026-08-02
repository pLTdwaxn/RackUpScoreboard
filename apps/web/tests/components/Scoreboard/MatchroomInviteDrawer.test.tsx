import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import QRCode from "qrcode";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MatchroomInviteDrawer from "@/components/Scoreboard/MatchroomInviteDrawer";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

describe("MatchroomInviteDrawer", () => {
  beforeEach(() => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue("data:image/png;base64,qr");
    window.history.pushState({}, "", "http://localhost:3000/");
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens invite details with the pairing QR code", async () => {
    render(<MatchroomInviteDrawer matchroomId="room 1" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open matchroom invite" }),
    );

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
    expect(screen.getByText("Invite Player")).toBeInTheDocument();
    expect(screen.getByText("room 1")).toBeInTheDocument();
    expect(
      await screen.findByAltText("QR code for matchroom room 1"),
    ).toBeInTheDocument();
  });
});
