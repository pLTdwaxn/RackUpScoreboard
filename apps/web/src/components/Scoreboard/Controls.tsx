"use client";

import { useMemo, useState } from "react";

import { Surface } from "@heroui/react";

import { Frame } from "@/types";

import AdvancedScoringPanel from "./AdvancedScoringPanel";
import ConcedeFrameDialog from "./ConcedeFrameDialog";
import FinishedFramePanel from "./FinishedFramePanel";
import SimpleScoringPanel from "./SimpleScoringPanel";
import { useGameActions } from "@/hooks/useGameActions";
import { useMatchroomActions } from "@/hooks/useSocket";
import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { useControlPanel } from "@/hooks/useControlPanel";
import { BALL_BY_NAME, BallName } from "@/lib/controlPanelShared";

function isLegalShot(
  pottedBalls: BallName[],
  objectBall: Frame["object_ball"],
  redsRemaining: number,
): boolean {
  if (pottedBalls.length === 0) {
    return false;
  }

  if (objectBall === "red") {
    return (
      pottedBalls.every((ball) => ball === "red") &&
      pottedBalls.length <= redsRemaining
    );
  }

  if (objectBall === "colour") {
    return pottedBalls.length === 1 && pottedBalls[0] !== "red";
  }

  return pottedBalls.length === 1 && pottedBalls[0] === objectBall;
}

function summarizeBalls(pottedBalls: BallName[]): string {
  const counts = pottedBalls.reduce<Record<string, number>>((acc, ball) => {
    acc[ball] = (acc[ball] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([ball, count]) => `${count} ${ball}`)
    .join(", ");
}

export default function Controls() {
  const { currentPlayerKey } = useMatchroomPlayers();
  const { hasFrame, frame, scoreKeeper, nextFrameConfirmations } =
    useMatchroomFrame();
  const { sendAction } = useMatchroomActions();
  const { sendShot, sendEndTurn, sendUndo, sendConcede, sendNextFrame } =
    useGameActions(sendAction, currentPlayerKey);

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isConcedeDialogOpen, setIsConcedeDialogOpen] = useState(false);
  const [multiPotBalls, setMultiPotBalls] = useState<BallName[]>([]);
  const [foulBall, setFoulBall] = useState<BallName | null>(null);
  const [foulMode, setFoulMode] = useState(false);

  const {
    isFrameFinished,
    hasConfirmedNextFrame,
    canKeepScore,
    redsRemaining,
    coloursOnTable,
    objectBall,
  } = useControlPanel(
    frame,
    scoreKeeper,
    currentPlayerKey,
    nextFrameConfirmations,
  );

  const redSelections = useMemo(
    () => multiPotBalls.filter((ball) => ball === "red").length,
    [multiPotBalls],
  );

  const comboSummary = useMemo(
    () => summarizeBalls(multiPotBalls),
    [multiPotBalls],
  );
  const comboIsFoul =
    multiPotBalls.length > 0 &&
    !isLegalShot(multiPotBalls, objectBall, redsRemaining);
  const foulPoints = foulBall ? BALL_BY_NAME[foulBall].penaltyPoints : 0;
  const hasSelectedBalls = multiPotBalls.length > 0 || foulBall !== null;
  const comboStatusChip =
    foulBall !== null
      ? { label: `FOUL ${foulPoints}`, color: "danger" as const }
      : comboIsFoul
        ? { label: "FOUL", color: "danger" as const }
        : multiPotBalls.length > 0
          ? { label: "LEGAL", color: "success" as const }
          : null;

  const enterAdvancedMode = (beforeEnter?: () => void) => {
    beforeEnter?.();
    setIsAdvancedMode(true);
  };

  const cancelAdvancedMode = () => {
    setMultiPotBalls([]);
    setFoulBall(null);
    setFoulMode(false);
    setIsAdvancedMode(false);
  };

  const setRedCount = (nextCount: number) => {
    const clamped = Math.max(0, Math.min(nextCount, redsRemaining));
    setMultiPotBalls((prev) => {
      const nonRedBalls = prev.filter((ball) => ball !== "red");
      return [
        ...nonRedBalls,
        ...Array.from({ length: clamped }, () => "red" as BallName),
      ];
    });
  };

  const resetRedSelections = () => {
    setRedCount(0);
  };

  const toggleMultiBall = (ball: BallName) => {
    if (ball === "red") {
      if (redSelections >= redsRemaining) {
        return;
      }

      setMultiPotBalls((prev) => [...prev, "red"]);
      return;
    }

    setMultiPotBalls((prev) => {
      if (prev.includes(ball)) {
        return prev.filter((pickedBall) => pickedBall !== ball);
      }

      return [...prev, ball];
    });
  };

  const handleBallTap = (ball: BallName) => {
    if (!canKeepScore) {
      return;
    }

    if (isAdvancedMode) {
      if (ball === "red") {
        toggleMultiBall(ball);
        return;
      }

      if (foulMode) {
        setFoulBall((prev) => (prev === ball ? null : ball));
        return;
      }

      toggleMultiBall(ball);
      return;
    }

    const legalSingle = isLegalShot([ball], objectBall, redsRemaining);
    if (legalSingle) {
      sendShot([ball], 0);
      return;
    }

    setFoulBall(null);
    setFoulMode(false);
    setMultiPotBalls([ball]);
    enterAdvancedMode();
  };

  const toggleFoulMode = () => {
    setFoulMode((prev) => {
      if (prev) {
        setFoulBall(null);
      } else {
        setMultiPotBalls([]);
      }

      setIsAdvancedMode(true);
      return !prev;
    });
  };

  const submitComposer = () => {
    if (!hasSelectedBalls) {
      return;
    }

    sendShot(multiPotBalls, foulPoints);
    cancelAdvancedMode();
  };

  const advancedSummary = (() => {
    if (multiPotBalls.length > 0 && foulMode) {
      return `Pot ${comboSummary} + foul`;
    }

    if (foulBall) {
      return `Foul on ${foulBall}`;
    }

    if (multiPotBalls.length > 0) {
      return `Pot ${comboSummary}`;
    }

    return foulMode ? "Tap the ball fouled on" : "Tap the balls potted";
  })();

  if (!hasFrame) {
    return null;
  }

  return (
    <Surface
      variant="default"
      className="mt-auto w-full items-center rounded-3xl p-3 text-center"
    >
      {isFrameFinished ? (
        <FinishedFramePanel
          winnerKey={frame.winner_key}
          currentPlayerKey={currentPlayerKey}
          hasConfirmedNextFrame={hasConfirmedNextFrame}
          onNextFrame={sendNextFrame}
        />
      ) : (
        <>
          {isAdvancedMode ? (
            <AdvancedScoringPanel
              summary={advancedSummary}
              statusChip={comboStatusChip}
              redsRemaining={redsRemaining}
              coloursOnTable={coloursOnTable}
              objectBall={objectBall}
              canKeepScore={canKeepScore}
              redSelections={redSelections}
              foulMode={foulMode}
              selectedBalls={
                foulMode ? (foulBall ? [foulBall] : []) : multiPotBalls
              }
              comboIsFoul={comboIsFoul}
              hasSelectedBalls={hasSelectedBalls}
              onBallTap={handleBallTap}
              onResetRedSelections={resetRedSelections}
              onExitAdvancedMode={cancelAdvancedMode}
              onChangeFoulMode={toggleFoulMode}
              onSubmit={submitComposer}
            />
          ) : (
            <SimpleScoringPanel
              redsRemaining={redsRemaining}
              coloursOnTable={coloursOnTable}
              objectBall={objectBall}
              canKeepScore={canKeepScore}
              selectedBalls={multiPotBalls}
              onBallTap={handleBallTap}
              onConcede={() => setIsConcedeDialogOpen(true)}
              onEnterAdvancedMode={() => {
                enterAdvancedMode(() => {
                  setFoulMode(false);
                  setFoulBall(null);
                  setMultiPotBalls([]);
                });
              }}
              onDeclareFoul={toggleFoulMode}
              onEndTurn={sendEndTurn}
              onUndo={sendUndo}
            />
          )}

          <ConcedeFrameDialog
            open={isConcedeDialogOpen}
            onOpenChange={setIsConcedeDialogOpen}
            onConfirm={sendConcede}
          />
        </>
      )}
    </Surface>
  );
}
