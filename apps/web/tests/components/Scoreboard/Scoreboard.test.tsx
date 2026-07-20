import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Scoreboard from "@/components/Scoreboard/Scoreboard";

vi.mock("@heroui/react", () => ({
  toast: {
    danger: vi.fn(),
  },
}));

vi.mock("@/hooks/useSocket", () => ({
  useMatchroomSession: () => ({
    connectionStatus: "reconnecting",
    reconnectAttempt: 3,
    reconnectDelayMs: 4000,
    socketError: null,
  }),
}));

vi.mock("@/components/Scoreboard", () => ({
  Controls: () => <div data-testid="controls" />,
  FrameLog: () => <div data-testid="frame-log" />,
  FrameOverview: () => <div data-testid="frame-overview" />,
}));

describe("Scoreboard", () => {
  it("shows a reconnecting status banner", () => {
    render(<Scoreboard />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Connection lost. Reconnecting...",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Try 3 in 4s");
  });
});
