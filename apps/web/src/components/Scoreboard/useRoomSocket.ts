import { useEffect, useRef, useState } from "react";

import { GameStateMessage, Player, RoomSocketMessage } from "@/types";

function toWebsocketUrl(
  apiBase: string,
  query: Record<string, string>,
): string {
  const parsed = new URL(apiBase);
  const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams(query);
  return `${protocol}//${parsed.host}/ws/room/?${params.toString()}`;
}

export function useRoomSocket(
  playerKey: string,
  matchroomId: string | null,
): {
  gameState: GameStateMessage | null;
  players: Player[];
  socketError: string | null;
  sendEvent: (payload: Record<string, unknown>) => void;
} {
  const [gameState, setGameState] = useState<GameStateMessage | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!matchroomId) {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8004";
    const websocketUrl = toWebsocketUrl(apiBase, {
      matchroom_id: matchroomId,
      session_key: playerKey,
    });

    const socket = new WebSocket(websocketUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
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
            // Presence events are informational and do not carry state snapshots.
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

    socket.onerror = () => {
      setSocketError("Room connection failed.");
    };

    return () => {
      socketRef.current = null;
      socket.close();
      setGameState(null);
      setPlayers([]);
      setSocketError(null);
    };
  }, [matchroomId, playerKey]);

  const sendEvent = (payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError("Room connection not ready.");
      return;
    }
    socket.send(JSON.stringify(payload));
  };

  return {
    gameState: matchroomId ? gameState : null,
    players: matchroomId ? players : [],
    socketError: matchroomId ? socketError : null,
    sendEvent,
  };
}
