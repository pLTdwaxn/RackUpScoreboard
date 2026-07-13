"use client";
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
import { getClientApiBase } from "@/lib/env";

interface MatchroomSessionContextType {
  matchroomId: string;
  hydrated: boolean;
  hasRoomSession: boolean;
  readyToRenderRoom: boolean;
  sessionKey: string;
  isConnected: boolean;
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

export const MatchroomProvider = ({
  matchroomId,
  children,
}: {
  matchroomId: string;
  children: ReactNode;
}) => {
  const [gameState, setGameState] = useState<GameStateMessage | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
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
      setSocketError(
        "Scoreboard backend URL is not configured. Set NEXT_PUBLIC_API_BASE in your deployed frontend environment.",
      );
      return;
    }

    const websocketUrl = toWebsocketUrl(apiBase, {
      matchroom_id: matchroomId,
      session_key: sessionKey,
    });

    const ws = new WebSocket(websocketUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setSocketError(null);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RoomSocketMessage;

        if (!payload || typeof payload !== "object" || !("type" in payload)) {
          setSocketError("Received invalid room update.");
          return;
        }

        switch (payload.type) {
          case "error": {
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
            setSocketError("Received invalid room update.");
            return;
          }
        }
      } catch {
        setSocketError("Failed to parse room update.");
      }
    };

    ws.onerror = () => {
      setSocketError("Room connection failed.");
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socketRef.current = null;
      ws.close();
      setIsConnected(false);
      setSocketError(null);
      setGameState(null);
      setPlayers([]);
    };
  }, [matchroomId, sessionKey]);

  const sendEvent = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError("Room connection not ready.");
      return;
    }
    socket.send(JSON.stringify(payload));
  }, []);

  const sendAction = useCallback(
    (action: RoomClientAction) => {
      sendEvent(action);
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
      socketError,
    }),
    [
      matchroomId,
      hydrated,
      hasRoomSession,
      readyToRenderRoom,
      sessionKey,
      isConnected,
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
