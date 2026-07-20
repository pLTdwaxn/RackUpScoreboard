import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { toast } from "@heroui/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MatchroomProvider,
  useMatchroomActions,
  useMatchroomGame,
  useMatchroomSession,
} from "@/hooks/useSocket";
import { DEFAULT_FRAME, DEFAULT_MATCH, DEFAULT_MATCHROOM } from "@/lib/viewModel";

vi.mock("@heroui/react", () => ({
  toast: {
    danger: vi.fn(),
    warning: vi.fn(),
  },
}));

const ROOM_SESSION_KEY_STORAGE_KEY = "scoreboard.room_session_key";

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  serverClose(code = 1006) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }

  receive(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  receiveRaw(data: string) {
    this.onmessage?.({ data } as MessageEvent);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

function StatusProbe() {
  const session = useMatchroomSession();
  const game = useMatchroomGame();
  const { sendAction } = useMatchroomActions();

  return (
    <>
      <div data-testid="status">{session.connectionStatus}</div>
      <div data-testid="connected">{String(session.isConnected)}</div>
      <div data-testid="attempt">{session.reconnectAttempt}</div>
      <div data-testid="delay">{session.reconnectDelayMs ?? "none"}</div>
      <div data-testid="error">{session.socketError ?? ""}</div>
      <div data-testid="players">{game.players.length}</div>
      <button
        type="button"
        onClick={() => sendAction({ action: "pass_shot", data: {} })}
      >
        Send
      </button>
    </>
  );
}

describe("MatchroomProvider websocket reconnects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    sessionStorage.clear();
    sessionStorage.setItem(
      ROOM_SESSION_KEY_STORAGE_KEY,
      JSON.stringify({ room1: "session1" }),
    );
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("reconnects with capped exponential backoff after the socket closes", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(
      "ws://localhost:8004/ws/room/?matchroom_id=room1&session_key=session1",
    );
    expect(screen.getByTestId("status")).toHaveTextContent("connecting");

    act(() => {
      MockWebSocket.instances[0].open();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("connected");
    expect(screen.getByTestId("connected")).toHaveTextContent("true");

    act(() => {
      MockWebSocket.instances[0].serverClose();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("reconnecting");
    expect(screen.getByTestId("connected")).toHaveTextContent("false");
    expect(screen.getByTestId("attempt")).toHaveTextContent("1");
    expect(screen.getByTestId("delay")).toHaveTextContent("1000");
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(MockWebSocket.instances).toHaveLength(2);

    act(() => {
      MockWebSocket.instances[1].serverClose();
    });

    expect(screen.getByTestId("attempt")).toHaveTextContent("2");
    expect(screen.getByTestId("delay")).toHaveTextContent("2000");
  });

  it("clears reconnect state when a retry connects", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    act(() => {
      MockWebSocket.instances[0].serverClose();
      vi.advanceTimersByTime(1000);
      MockWebSocket.instances[1].open();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("connected");
    expect(screen.getByTestId("connected")).toHaveTextContent("true");
    expect(screen.getByTestId("attempt")).toHaveTextContent("0");
    expect(screen.getByTestId("delay")).toHaveTextContent("none");
  });

  it("updates game state from socket messages", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    act(() => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].receive({
        type: "game_state",
        matchroom: DEFAULT_MATCHROOM,
        players: [
          {
            session_key: "session1",
            name: "Ada",
            type: "anonymous",
            match_score: 0,
            current_frame_score: 0,
            highest_break: null,
          },
        ],
        scores: {},
        match_scores: {},
        match: DEFAULT_MATCH,
        current_frame: DEFAULT_FRAME,
        frame_log: [],
        score_keeper: "self",
      });
    });

    expect(screen.getByTestId("players")).toHaveTextContent("1");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("handles socket parse, validation, and room-not-found errors", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    act(() => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].receiveRaw("{");
    });
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Failed to parse room update.",
    );

    act(() => {
      MockWebSocket.instances[0].receive({ nope: true });
    });
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Received invalid room update.",
    );

    act(() => {
      MockWebSocket.instances[0].serverClose(4404);
    });
    expect(screen.getByTestId("status")).toHaveTextContent("failed");
    expect(screen.getByTestId("error")).toHaveTextContent("Matchroom not found.");
  });

  it("routes socket errors to field error or action warning toast", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    act(() => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].receive({
        type: "error",
        message: "Room problem.",
      });
    });
    expect(screen.getByTestId("error")).toHaveTextContent("Room problem.");

    act(() => {
      MockWebSocket.instances[0].receive({
        type: "error",
        action_id: "action-1",
        message: "Action rejected.",
      });
    });
    expect(toast.warning).toHaveBeenCalledWith("Action rejected.", {
      timeout: 2000,
    });
  });

  it("sends actions with generated IDs and reports closed sockets", () => {
    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    act(() => {
      MockWebSocket.instances[0].open();
    });
    act(() => {
      screen.getByRole("button", { name: "Send" }).click();
    });

    expect(MockWebSocket.instances[0].send).toHaveBeenCalledOnce();
    expect(
      JSON.parse(MockWebSocket.instances[0].send.mock.calls[0][0] as string),
    ).toMatchObject({
      action: "pass_shot",
      data: {},
      action_id: expect.any(String),
    });

    act(() => {
      MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED;
    });
    act(() => {
      screen.getByRole("button", { name: "Send" }).click();
    });

    expect(screen.getByTestId("error")).toHaveTextContent(
      "Room connection not ready.",
    );
  });

  it("clears invalid stored sessions", () => {
    sessionStorage.setItem(ROOM_SESSION_KEY_STORAGE_KEY, "{");

    render(
      <MatchroomProvider matchroomId="room1">
        <StatusProbe />
      </MatchroomProvider>,
    );

    expect(sessionStorage.getItem(ROOM_SESSION_KEY_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("status")).toHaveTextContent("idle");
  });

  it("throws helpful errors when hooks are used outside the provider", () => {
    expect(() => renderHook(() => useMatchroomSession())).toThrow(
      "useMatchroomSession must be used within MatchroomProvider",
    );
    expect(() => renderHook(() => useMatchroomGame())).toThrow(
      "useMatchroomGame must be used within MatchroomProvider",
    );
    expect(() => renderHook(() => useMatchroomActions())).toThrow(
      "useMatchroomActions must be used within MatchroomProvider",
    );
  });
});
