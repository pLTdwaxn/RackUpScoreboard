"use client";

import { useEffect, useState } from "react";

import { Surface, toast } from "@heroui/react";

import { MatchroomConnection } from "@/types";

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

const MATCHROOM_STORAGE_KEY = "scoreboard.matchroom";

export default function Scoreboard() {
  const [matchroom, setMatchroom] = useState<MatchroomConnection | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const currentPlayerKey = matchroom?.playerKey ?? "";

  const { gameState, players, socketError, sendEvent } = useRoomSocket(
    currentPlayerKey,
    matchroom?.matchroomId ?? "",
  );

  console.log("gameState:", gameState);

  useEffect(() => {
    try {
      const savedRoom = localStorage.getItem(MATCHROOM_STORAGE_KEY);

      if (savedRoom) {
        try {
          const parsed = JSON.parse(savedRoom) as Partial<MatchroomConnection>;
          const hasValidConnection =
            typeof parsed.matchroomId === "string" &&
            parsed.matchroomId.length > 0 &&
            typeof parsed.playerKey === "string" &&
            parsed.playerKey.length > 0 &&
            typeof parsed.displayName === "string" &&
            (parsed.identityType === "verified" ||
              parsed.identityType === "anonymous");

          if (hasValidConnection) {
            setMatchroom(parsed as MatchroomConnection);
          } else {
            localStorage.removeItem(MATCHROOM_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(MATCHROOM_STORAGE_KEY);
        }
      }
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!socketError) {
      return;
    }

    toast.danger(socketError, { timeout: 1000 });
  }, [socketError]);

  const handleConnected = (payload: MatchroomConnection) => {
    localStorage.setItem(MATCHROOM_STORAGE_KEY, JSON.stringify(payload));
    setMatchroom(payload);
  };

  const resetRoom = () => {
    localStorage.removeItem(MATCHROOM_STORAGE_KEY);
    setMatchroom(null);
  };

  const currentPlayerName =
    players.find((player) => player.session_key === currentPlayerKey)?.name ??
    currentPlayerKey;

  const turnPlayerKey =
    gameState?.current_frame.current_turn || currentPlayerKey;

  const turnPlayerName =
    players.find((player) => player.session_key === turnPlayerKey)?.name ??
    currentPlayerName;

  const { sendShot, sendEndTurn, sendUndo, sendConcede, sendNextFrame } =
    useGameActions(sendEvent, turnPlayerName);

  const viewModel = buildScoreboardViewModel({
    gameState,
  });

  if (!hasHydrated) {
    return null;
  }

  return (
    <Surface
      variant="tertiary"
      className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden p-0"
    >
      <TopRow>
        <Menu />
        <MatchroomOverview
          roomReady={viewModel.roomReady}
          matchroomId={matchroom?.matchroomId || ""}
          match={viewModel.match}
          resetRoom={resetRoom}
        />
        <ThemeToggle />
      </TopRow>
      {!matchroom ? (
        <NewMatch onConnected={handleConnected} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
          <MatchOverview
            match={viewModel.match}
            frame={viewModel.frame}
            players={viewModel.players}
            currentPlayerKey={currentPlayerKey}
          />
          <FrameOverview
            frame={viewModel.frame}
            players={viewModel.players}
            currentPlayerKey={currentPlayerKey}
          />
          <MatchLog />
          <Controls
            frame={viewModel.frame}
            currentPlayerKey={currentPlayerKey}
            nextFrameConfirmations={gameState?.next_frame_confirmations ?? []}
            scoreKeeper={viewModel.scoreKeeper}
            sendShot={sendShot}
            sendEndTurn={sendEndTurn}
            sendUndo={sendUndo}
            sendConcede={sendConcede}
            sendNextFrame={sendNextFrame}
          />
        </div>
      )}
    </Surface>
  );
}
