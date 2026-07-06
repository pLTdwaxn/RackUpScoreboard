"use client";

import { useEffect, useRef, useState } from "react";

import { Surface, toast } from "@heroui/react";

import {
  ConnectedInstance,
  GameStateMessage,
  Player,
  RoomSocketMessage,
} from "@/types";

import {
  Controls,
  FrameOverview,
  MatchOverview,
  MatchLog,
  MatchroomOverview,
  Menu,
  NewMatch,
  TopRow,
} from ".";
import { buildScoreboardViewModel } from "./viewModel";

const INSTANCE_STORAGE_KEY = "scoreboard.instance";
const MATCHROOM_STORAGE_KEY = "scoreboard.matchroom";

function toWebsocketUrl(
  apiBase: string,
  query: Record<string, string>,
): string {
  const parsed = new URL(apiBase);
  const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams(query);
  return `${protocol}//${parsed.host}/ws/room/?${params.toString()}`;
}

export default function Scoreboard() {
  const [instance, setInstance] = useState<ConnectedInstance | null>(null);
  const [matchroomId, setMatchroomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameStateMessage | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    try {
      const savedInstance = localStorage.getItem(INSTANCE_STORAGE_KEY);
      const savedRoom = localStorage.getItem(MATCHROOM_STORAGE_KEY);

      if (savedInstance) {
        setInstance(JSON.parse(savedInstance) as ConnectedInstance);
      }

      if (savedRoom) {
        setMatchroomId(savedRoom);
      }
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!instance || !matchroomId) {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8004";
    const websocketUrl = toWebsocketUrl(apiBase, {
      match_id: matchroomId,
      identity_type: "anonymous",
      player_id: instance.instanceId,
      display_name: instance.displayName,
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
    };
  }, [instance, matchroomId]);

  const handleConnected = (payload: {
    instance: ConnectedInstance;
    matchroomId: string;
  }) => {
    localStorage.setItem(
      INSTANCE_STORAGE_KEY,
      JSON.stringify(payload.instance),
    );
    localStorage.setItem(MATCHROOM_STORAGE_KEY, payload.matchroomId);
    setInstance(payload.instance);
    setMatchroomId(payload.matchroomId);
    setGameState(null);
    setSocketError(null);
  };

  const resetRoom = () => {
    localStorage.removeItem(MATCHROOM_STORAGE_KEY);
    setMatchroomId(null);
    setPlayers([]);
    setGameState(null);
    setSocketError(null);
    localStorage.removeItem(INSTANCE_STORAGE_KEY);
    setInstance(null);
  };

  const sendEvent = (payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError("Room connection not ready.");
      return;
    }

    socket.send(JSON.stringify(payload));
  };

  const sendPot = (ball: string) => {
    sendEvent({
      player: currentPlayerKey,
      potted_balls: [ball],
      foul: 0,
    });
  };

  const sendFoul = () => {
    sendEvent({
      player: currentPlayerKey,
      potted_balls: [],
      foul: 4,
    });
  };

  const sendEndTurn = () => {
    sendEvent({
      player: currentPlayerKey,
      potted_balls: [],
      foul: 0,
    });
  };

  const sendUndo = () => {
    sendEvent({ undo: true });
  };

  const currentPlayerKey =
    instance?.playerKey ?? `anon_${instance?.instanceId ?? ""}`;
  const viewModel = buildScoreboardViewModel({
    gameState,
    players,
  });

  if (!hasHydrated) {
    return null;
  }

  return (
    <Surface
      variant="transparent"
      className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 overflow-hidden bg-[var(--background)] p-2 text-[var(--foreground)]"
    >
      <TopRow>
        <Menu />
        <MatchroomOverview
          roomReady={viewModel.roomReady}
          matchroomId={matchroomId || ""}
          resetRoom={resetRoom}
        />
        {/* <MatchLog /> */}
      </TopRow>
      {!instance || !matchroomId ? (
        <NewMatch onConnected={handleConnected} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <MatchOverview
            match={viewModel.match}
            players={viewModel.players}
            currentPlayerKey={currentPlayerKey}
          />
          <FrameOverview
            players={viewModel.players}
            currentPlayerKey={currentPlayerKey}
            frame={viewModel.frame}
            table={viewModel.table}
          />
          <MatchLog />
        </div>
      )}

      {viewModel.roomReady ? (
        <Controls
          table={viewModel.table}
          scoreKeeper={viewModel.scoreKeeper}
          currentPlayerKey={currentPlayerKey}
          sendPot={sendPot}
          sendFoul={sendFoul}
          sendEndTurn={sendEndTurn}
          sendUndo={sendUndo}
        />
      ) : null}
      {socketError ? toast.danger(socketError) : null}
    </Surface>
  );
}
