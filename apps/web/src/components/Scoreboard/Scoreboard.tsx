"use client";

import { useEffect, useState } from "react";

import { Surface, toast } from "@heroui/react";

import { ConnectedInstance } from "@/types";

import {
  Controls,
  FrameOverview,
  MatchOverview,
  MatchLog,
  MatchroomOverview,
  Menu,
  NewMatch,
  ThemeToggle,
  TopRow,
} from ".";
import { buildScoreboardViewModel } from "./viewModel";
import { useGameActions } from "./useGameActions";
import { useRoomSocket } from "./useRoomSocket";

const INSTANCE_STORAGE_KEY = "scoreboard.instance";
const MATCHROOM_STORAGE_KEY = "scoreboard.matchroom";

export default function Scoreboard() {
  const [instance, setInstance] = useState<ConnectedInstance | null>(null);
  const [matchroomId, setMatchroomId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const { gameState, players, socketError, sendEvent } = useRoomSocket(
    instance,
    matchroomId,
  );

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
  };

  const resetRoom = () => {
    localStorage.removeItem(MATCHROOM_STORAGE_KEY);
    localStorage.removeItem(INSTANCE_STORAGE_KEY);
    setMatchroomId(null);
    setInstance(null);
  };

  const currentPlayerKey =
    instance?.playerKey ?? `anon_${instance?.instanceId ?? ""}`;

  const currentPlayerName =
    players.find((player) => player.key === currentPlayerKey)?.name ??
    currentPlayerKey;

  const turnPlayerKey = gameState?.table.current_turn || currentPlayerKey;
  const turnPlayerName =
    players.find((player) => player.key === turnPlayerKey)?.name ??
    currentPlayerName;

  const { sendShot, sendEndTurn, sendUndo, sendConcede } = useGameActions(
    sendEvent,
    turnPlayerName,
  );

  const viewModel = buildScoreboardViewModel({
    gameState,
    players,
  });

  if (!hasHydrated) {
    return null;
  }

  return (
    <Surface
      variant="tertiary"
      className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 overflow-hidden p-0"
    >
      <TopRow>
        <Menu />
        <MatchroomOverview
          roomReady={viewModel.roomReady}
          matchroomId={matchroomId || ""}
          match={viewModel.match}
          resetRoom={resetRoom}
        />
        <ThemeToggle />
      </TopRow>
      {!instance || !matchroomId ? (
        <NewMatch onConnected={handleConnected} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
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
          sendShot={sendShot}
          sendEndTurn={sendEndTurn}
          sendUndo={sendUndo}
          sendConcede={sendConcede}
        />
      ) : null}
      {socketError ? toast.danger(socketError, { timeout: 1000 }) : null}
    </Surface>
  );
}
