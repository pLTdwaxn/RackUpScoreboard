"use client";

import { ReactNode, useMemo, useRef, useState } from "react";

import { AlertDialog, Button, ButtonGroup, Chip, Surface } from "@heroui/react";
import { IconMinus, IconPlus } from "@tabler/icons-react";

import { GameStateMessage, TableState } from "@/types";

import AdvancedControl, {
  AdvancedBallRail,
  AdvancedBottomActions,
} from "./AdvancedControl";
import SimpleControl, {
  SimpleBallRail,
  SimpleBottomActions,
} from "./SimpleControl";

type ControlsProps = {
  frameStatus: GameStateMessage["frame"]["status"];
  nextFrameConfirmations: string[];
  table: TableState;
  scoreKeeper: GameStateMessage["score_keeper"];
  currentPlayerKey: string;
  sendShot: (pottedBalls: string[], foul?: number) => void;
  sendEndTurn: () => void;
  sendUndo: () => void;
  sendConcede: () => void;
  sendNextFrame: () => void;
};

type BallName =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black";

type TransitionSlotProps = {
  isAdvancedMode: boolean;
  simpleContent: ReactNode;
  advancedContent: ReactNode;
  className?: string;
};

function TransitionSlot({
  isAdvancedMode,
  simpleContent,
  advancedContent,
  className = "",
}: TransitionSlotProps) {
  return (
    <div className={["relative m-0", className].join(" ")}>
      <div
        className={[
          "transition-all duration-200 ease-out",
          isAdvancedMode
            ? "pointer-events-none absolute inset-0 -translate-y-1 opacity-0"
            : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        {simpleContent}
      </div>

      <div
        className={[
          "transition-all duration-200 ease-out",
          isAdvancedMode
            ? "translate-y-0 opacity-100"
            : "pointer-events-none absolute inset-0 translate-y-1 opacity-0",
        ].join(" ")}
      >
        {advancedContent}
      </div>
    </div>
  );
}

function isLegalShot(
  pottedBalls: BallName[],
  objectBall: string,
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

function foulPointsForBall(ball: BallName): number {
  switch (ball) {
    case "blue":
      return 5;
    case "pink":
      return 6;
    case "black":
      return 7;
    default:
      return 4;
  }
}

export default function Controls({
  frameStatus,
  nextFrameConfirmations,
  table,
  scoreKeeper,
  currentPlayerKey,
  sendShot,
  sendEndTurn,
  sendUndo,
  sendConcede,
  sendNextFrame,
}: ControlsProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showAdvancedContent, setShowAdvancedContent] = useState(false);
  const [isConcedeDialogOpen, setIsConcedeDialogOpen] = useState(false);
  const [multiPotBalls, setMultiPotBalls] = useState<BallName[]>([]);
  const [foulBall, setFoulBall] = useState<BallName | null>(null);
  const [selectionMode, setSelectionMode] = useState<"pots" | "foul">("pots");
  const panelTransitionMs = 200;
  const panelTimeouts = useRef<number[]>([]);
  const isFrameFinished = frameStatus === "finished";
  const hasConfirmedNextFrame =
    nextFrameConfirmations.includes(currentPlayerKey);

  const redsRemaining = table.reds_remaining;
  const coloursOnTable = table.colours_on_table;
  const objectBall = table.object_ball;
  const isAtTable = table.current_turn === currentPlayerKey;
  const canKeepScore = (() => {
    switch (scoreKeeper) {
      case "self":
        return isAtTable;
      case "opp":
        return Boolean(table.current_turn) && !isAtTable;
      case "ref":
        return false;
      case "any":
        return true;
      default:
        return false;
    }
  })();

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
  const foulPoints = foulBall ? foulPointsForBall(foulBall) : 0;
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
    panelTimeouts.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    panelTimeouts.current = [];
    setIsPanelExpanded(true);
    panelTimeouts.current.push(
      window.setTimeout(() => {
        setShowAdvancedContent(true);
      }, panelTransitionMs),
    );
    setIsAdvancedMode(true);
  };

  const cancelAdvancedMode = () => {
    panelTimeouts.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    panelTimeouts.current = [];
    setShowAdvancedContent(false);
    panelTimeouts.current.push(
      window.setTimeout(() => {
        setIsPanelExpanded(false);
      }, panelTransitionMs),
    );
    setMultiPotBalls([]);
    setFoulBall(null);
    setSelectionMode("pots");
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

  const toggleMultiBall = (ball: BallName) => {
    if (ball === "red") {
      if (redSelections > 0) {
        setRedCount(redSelections - 1);
        return;
      }

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
      if (selectionMode === "foul") {
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

    setSelectionMode("pots");
    setFoulBall(null);
    setMultiPotBalls([ball]);
    enterAdvancedMode();
  };

  const submitComposer = () => {
    if (!hasSelectedBalls) {
      return;
    }

    sendShot(multiPotBalls, foulPoints);
    cancelAdvancedMode();
  };

  const advancedSummary = (() => {
    if (multiPotBalls.length > 0 && foulBall) {
      return `Pot ${comboSummary} + foul on ${foulBall}`;
    }

    if (foulBall) {
      return `Foul on ${foulBall}`;
    }

    if (multiPotBalls.length > 0) {
      return `Pot ${comboSummary}`;
    }

    return selectionMode === "foul"
      ? "Tap the ball fouled on"
      : "Tap the balls potted";
  })();

  const advancedMessageRow = (
    <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
      <span className="text-center">{advancedSummary}</span>
      {comboStatusChip ? (
        <Chip
          variant="soft"
          color={comboStatusChip.color}
          size="sm"
          className="m-0 min-w-14 justify-center"
        >
          {comboStatusChip.label}
        </Chip>
      ) : null}
    </div>
  );

  const advancedRedsRow = (
    <div className="flex w-full flex-row items-center">
      <ButtonGroup variant="primary" size="sm">
        <Button isIconOnly className="bg-red-400">
          <IconMinus stroke={2} />
        </Button>
        <Button isIconOnly className="bg-red-400">
          <ButtonGroup.Separator />
          <IconPlus stroke={2} />
        </Button>
      </ButtonGroup>
    </div>
  );

  const simpleBallRow = (
    <SimpleBallRail
      redsRemaining={redsRemaining}
      coloursOnTable={coloursOnTable}
      objectBall={objectBall}
      canKeepScore={canKeepScore}
      selectedBalls={multiPotBalls}
      onBallTap={handleBallTap}
    />
  );

  const simpleActionsRow = (
    <SimpleBottomActions
      canKeepScore={canKeepScore}
      onConcede={() => setIsConcedeDialogOpen(true)}
      onEnterAdvancedMode={() => {
        enterAdvancedMode(() => {
          setSelectionMode("pots");
          setFoulBall(null);
          setMultiPotBalls([]);
        });
      }}
      onDeclareFoul={() => {
        enterAdvancedMode(() => {
          setSelectionMode("foul");
          setMultiPotBalls([]);
          setFoulBall(null);
        });
      }}
      onEndTurn={sendEndTurn}
      onUndo={sendUndo}
    />
  );

  const advancedBallRow = (
    <AdvancedBallRail
      redsRemaining={redsRemaining}
      coloursOnTable={coloursOnTable}
      objectBall={objectBall}
      canKeepScore={canKeepScore}
      redSelections={redSelections}
      selectedBalls={
        selectionMode === "foul" ? (foulBall ? [foulBall] : []) : multiPotBalls
      }
      foulBall={foulBall}
      onBallTap={handleBallTap}
      showFoulPoints={Boolean(foulBall) || comboIsFoul}
    />
  );

  const advancedActionsRow = (
    <AdvancedBottomActions
      canKeepScore={canKeepScore}
      selectionMode={selectionMode}
      comboIsFoul={comboIsFoul}
      hasSelectedBalls={hasSelectedBalls}
      onExitAdvancedMode={cancelAdvancedMode}
      onChangeSelectionMode={setSelectionMode}
      onSubmit={submitComposer}
    />
  );

  return (
    <Surface
      variant="default"
      className={[
        "mt-auto w-full items-center rounded-3xl p-3 text-center",
        "transition-[min-height] duration-200 ease-out",
        isPanelExpanded ? "min-h-52" : "min-h-0",
      ].join(" ")}
    >
      {isFrameFinished ? (
        <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
          <p className="font-mono text-sm tracking-wide uppercase text-muted">
            Frame Finished
          </p>
          {hasConfirmedNextFrame ? (
            <p className="font-mono text-sm tracking-wide uppercase text-muted">
              Waiting for your opponent
            </p>
          ) : (
            <Button variant="primary" onPress={sendNextFrame}>
              Start Next Frame
            </Button>
          )}
        </div>
      ) : (
        <>
          <TransitionSlot
            isAdvancedMode={showAdvancedContent}
            simpleContent={
              <SimpleControl
                messageRow={null}
                ballRow={simpleBallRow}
                actionsRow={simpleActionsRow}
              />
            }
            advancedContent={
              <AdvancedControl
                messageRow={advancedMessageRow}
                ballRow={advancedBallRow}
                redsRow={advancedRedsRow}
                actionsRow={advancedActionsRow}
              />
            }
          />

          <AlertDialog
            isOpen={isConcedeDialogOpen}
            onOpenChange={setIsConcedeDialogOpen}
          >
            <AlertDialog.Backdrop variant="blur">
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Heading>Conceding Frame</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    Are you sure you want to concede the frame?
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button
                      variant="secondary"
                      onPress={() => setIsConcedeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onPress={() => {
                        sendConcede();
                        setIsConcedeDialogOpen(false);
                      }}
                    >
                      Concede
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </>
      )}
    </Surface>
  );
}
