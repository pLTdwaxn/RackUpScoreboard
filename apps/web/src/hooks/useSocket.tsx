"use client";
import { toast } from "@heroui/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  ReactNode,
} from "react";
import {
  GameStateMessage,
  Player,
  RoomClientAction,
  RoomSocketMessage,
} from "@/types";
import { getAppDictionary } from "@/i18n";
import { getClientApiBase } from "@/lib/env";

interface MatchroomSessionContextType {
  matchroomId: string;
  hydrated: boolean;
  hasRoomSession: boolean;
  readyToRenderRoom: boolean;
  sessionKey: string;
  isConnected: boolean;
  connectionStatus: SocketConnectionStatus;
  reconnectAttempt: number;
  reconnectDelayMs: number | null;
  socketError: string | null;
}

interface MatchroomGameContextType {
  gameState: GameStateMessage | null;
  players: Player[];
}

interface MatchroomActionsContextType {
  sendEvent: (payload: Record<string, unknown>) => void;
  sendAction: (action: RoomClientAction) => void;
}

const MatchroomSessionContext =
  createContext<MatchroomSessionContextType | null>(null);
const MatchroomGameContext = createContext<MatchroomGameContextType | null>(
  null,
);
const MatchroomActionsContext =
  createContext<MatchroomActionsContextType | null>(null);
const ROOM_SESSION_KEY_STORAGE_KEY = "scoreboard.room_session_key";
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

function readRoomSessionKey(matchroomId: string): string {
  if (!matchroomId || typeof window === "undefined") {
    return "";
  }

  const byRoomRaw = sessionStorage.getItem(ROOM_SESSION_KEY_STORAGE_KEY);
  if (!byRoomRaw) {
    return "";
  }

  try {
    const byRoom = JSON.parse(byRoomRaw) as Record<string, string>;
    return byRoom[matchroomId] ?? "";
  } catch {
    sessionStorage.removeItem(ROOM_SESSION_KEY_STORAGE_KEY);
    return "";
  }
}

function toWebsocketUrl(
  apiBase: string,
  query: Record<string, string>,
): string {
  const parsed = new URL(apiBase);
  const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams(query);
  return `${protocol}//${parsed.host}/ws/room/?${params.toString()}`;
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export const MatchroomProvider = ({
  matchroomId,
  children,
}: {
  matchroomId: string;
  children: ReactNode;
}) => {
  const copy = getAppDictionary("en").errors;
  const [gameState, setGameState] = useState<GameStateMessage | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<SocketConnectionStatus>("idle");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [reconnectDelayMs, setReconnectDelayMs] = useState<number | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sessionKey = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleRoomSessionUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<{
          matchroomId?: string;
        }>;

        if (customEvent.detail.matchroomId !== matchroomId) {
          return;
        }

        onStoreChange();
      };

      window.addEventListener(
        "scoreboard:room-session-updated",
        handleRoomSessionUpdate,
      );
      window.addEventListener("storage", onStoreChange);

      return () => {
        window.removeEventListener(
          "scoreboard:room-session-updated",
          handleRoomSessionUpdate,
        );
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => readRoomSessionKey(matchroomId),
    () => "",
  );

  useEffect(() => {
    if (!matchroomId || !sessionKey) {
      return;
    }

    if (typeof window !== "undefined") {
      const byRoomRaw = sessionStorage.getItem(ROOM_SESSION_KEY_STORAGE_KEY);
      let byRoom: Record<string, string> = {};
      if (byRoomRaw) {
        try {
          byRoom = JSON.parse(byRoomRaw) as Record<string, string>;
        } catch {
          sessionStorage.removeItem(ROOM_SESSION_KEY_STORAGE_KEY);
        }
      }
      byRoom[matchroomId] = sessionKey;
      sessionStorage.setItem(
        ROOM_SESSION_KEY_STORAGE_KEY,
        JSON.stringify(byRoom),
      );
    }

    const apiBase = getClientApiBase();
    if (!apiBase) {
      queueMicrotask(() => {
        setSocketError(copy.backendUrlNotConfigured);
        setConnectionStatus("failed");
      });
      return;
    }
    const websocketApiBase: string = apiBase;

    let isActive = true;
    let attempt = 0;

    const clearReconnectTimeout = () => {
      if (!reconnectTimeoutRef.current) {
        return;
      }

      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    };

    const scheduleReconnect = () => {
      if (!isActive) {
        return;
      }

      attempt += 1;
      const delayMs = Math.min(
        INITIAL_RECONNECT_DELAY_MS * 2 ** (attempt - 1),
        MAX_RECONNECT_DELAY_MS,
      );

      setConnectionStatus("reconnecting");
      setReconnectAttempt(attempt);
      setReconnectDelayMs(delayMs);
      reconnectTimeoutRef.current = setTimeout(connectSocket, delayMs);
    };

    function connectSocket() {
      if (!isActive) {
        return;
      }

      clearReconnectTimeout();

      const websocketUrl = toWebsocketUrl(websocketApiBase, {
        matchroom_id: matchroomId,
        session_key: sessionKey,
      });

      const ws = new WebSocket(websocketUrl);
      socketRef.current = ws;

      setIsConnected(false);
      setConnectionStatus(attempt === 0 ? "connecting" : "reconnecting");

      ws.onopen = () => {
        if (!isActive || socketRef.current !== ws) {
          return;
        }

        attempt = 0;
        setIsConnected(true);
        setConnectionStatus("connected");
        setReconnectAttempt(0);
        setReconnectDelayMs(null);
        setSocketError(null);
      };

      ws.onmessage = (event) => {
        if (!isActive || socketRef.current !== ws) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as RoomSocketMessage;

          if (!payload || typeof payload !== "object" || !("type" in payload)) {
            setSocketError(copy.invalidRoomUpdate);
            return;
          }

          switch (payload.type) {
            case "error": {
              if (payload.action_id) {
                toast.warning(payload.message, { timeout: 2000 });
                return;
              }

              setSocketError(payload.message);
              return;
            }
            case "player_status_change": {
              return;
            }
            case "game_state": {
              setSocketError(null);
              setGameState(payload);
              setPlayers(payload.players);
              return;
            }
            default: {
              setSocketError(copy.invalidRoomUpdate);
              return;
            }
          }
        } catch {
          setSocketError(copy.roomUpdateParseFailed);
        }
      };

      ws.onerror = () => {
        if (!isActive || socketRef.current !== ws) {
          return;
        }

        setIsConnected(false);
      };

      ws.onclose = (event) => {
        if (!isActive || socketRef.current !== ws) {
          return;
        }

        socketRef.current = null;
        setIsConnected(false);

        if (event.code === 4404) {
          setConnectionStatus("failed");
          setReconnectDelayMs(null);
          setSocketError(copy.matchroomNotFound);
          return;
        }

        scheduleReconnect();
      };
    }

    connectSocket();

    return () => {
      isActive = false;
      clearReconnectTimeout();
      const currentSocket = socketRef.current;
      socketRef.current = null;
      setReconnectAttempt(0);
      setReconnectDelayMs(null);
      setConnectionStatus("idle");
      if (currentSocket && currentSocket.readyState !== WebSocket.CLOSED) {
        currentSocket.close();
      }
      setIsConnected(false);
      setSocketError(null);
      setGameState(null);
      setPlayers([]);
    };
  }, [
    copy.backendUrlNotConfigured,
    copy.invalidRoomUpdate,
    copy.matchroomNotFound,
    copy.roomUpdateParseFailed,
    matchroomId,
    sessionKey,
  ]);

  const sendEvent = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError(copy.roomConnectionNotReady);
      return;
    }
    socket.send(JSON.stringify(payload));
  }, [copy.roomConnectionNotReady]);

  const sendAction = useCallback(
    (action: RoomClientAction) => {
      sendEvent({
        ...action,
        action_id: action.action_id ?? createMessageId(),
      });
    },
    [sendEvent],
  );

  const hasRoomSession = hydrated && Boolean(sessionKey);
  const readyToRenderRoom =
    hasRoomSession && (isConnected || Boolean(gameState));

  const sessionValue = useMemo(
    () => ({
      matchroomId,
      hydrated,
      hasRoomSession,
      readyToRenderRoom,
      sessionKey,
      isConnected,
      connectionStatus,
      reconnectAttempt,
      reconnectDelayMs,
      socketError,
    }),
    [
      matchroomId,
      hydrated,
      hasRoomSession,
      readyToRenderRoom,
      sessionKey,
      isConnected,
      connectionStatus,
      reconnectAttempt,
      reconnectDelayMs,
      socketError,
    ],
  );

  const gameValue = useMemo(
    () => ({
      gameState,
      players,
    }),
    [gameState, players],
  );

  const actionsValue = useMemo(
    () => ({
      sendEvent,
      sendAction,
    }),
    [sendEvent, sendAction],
  );

  return (
    <MatchroomSessionContext.Provider value={sessionValue}>
      <MatchroomGameContext.Provider value={gameValue}>
        <MatchroomActionsContext.Provider value={actionsValue}>
          {children}
        </MatchroomActionsContext.Provider>
      </MatchroomGameContext.Provider>
    </MatchroomSessionContext.Provider>
  );
};

export const useMatchroomSession = () => {
  const context = useContext(MatchroomSessionContext);
  if (!context)
    throw new Error(
      "useMatchroomSession must be used within MatchroomProvider",
    );
  return context;
};

export const useMatchroomGame = () => {
  const context = useContext(MatchroomGameContext);
  if (!context)
    throw new Error("useMatchroomGame must be used within MatchroomProvider");
  return context;
};

export const useMatchroomActions = () => {
  const context = useContext(MatchroomActionsContext);
  if (!context)
    throw new Error(
      "useMatchroomActions must be used within MatchroomProvider",
    );
  return context;
};

// Compatibility hook; prefer focused hooks for better render isolation.
export const useSocket = () => {
  return {
    ...useMatchroomSession(),
    ...useMatchroomGame(),
    ...useMatchroomActions(),
  };
};
