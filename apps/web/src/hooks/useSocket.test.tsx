import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MatchroomProvider,
  useMatchroomActions,
  useMatchroomSession,
} from "./useSocket";

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

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

function StatusProbe() {
  const session = useMatchroomSession();
  const { sendAction } = useMatchroomActions();

  return (
    <>
      <div data-testid="status">{session.connectionStatus}</div>
      <div data-testid="connected">{String(session.isConnected)}</div>
      <div data-testid="attempt">{session.reconnectAttempt}</div>
      <div data-testid="delay">{session.reconnectDelayMs ?? "none"}</div>
      <div data-testid="error">{session.socketError ?? ""}</div>
      <button type="button" onClick={() => sendAction({ type: "pass_shot" })}>
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
});
