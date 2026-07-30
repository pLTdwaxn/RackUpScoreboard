import { useMemo, useState } from "react";

import { Frame } from "@/types";
import { BALL_BY_NAME, BallName } from "@/domain/balls";

import {
  inferFoulPoints,
  isLegalShot,
  summarizeBalls,
} from "./scoringRules";

type UseShotComposerParams = {
  canKeepScore: boolean;
  canUseFoulOptions: boolean;
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: Frame["object_ball"];
  freeBall: Frame["free_ball"];
  sendShot: (pottedBalls: string[], foul?: number) => void;
  sendDeclareFreeBall: (nominatedColour: string) => void;
};

function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function formatPottedReds(count: number) {
  return `${count} ${pluralise(count, "red")} potted`;
}

export function useShotComposer({
  canKeepScore,
  canUseFoulOptions,
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  sendShot,
  sendDeclareFreeBall,
}: UseShotComposerParams) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [multiPotBalls, setMultiPotBalls] = useState<BallName[]>([]);
  const [foulBall, setFoulBall] = useState<BallName | null>(null);
  const [foulMode, setFoulMode] = useState(false);
  const [freeBallMode, setFreeBallMode] = useState(false);

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
    !isLegalShot(multiPotBalls, objectBall, redsRemaining, freeBall);
  const foulPoints = foulBall ? BALL_BY_NAME[foulBall].penaltyPoints : 0;
  const inferredFreeBallFoulPoints =
    freeBall && comboIsFoul ? inferFoulPoints(multiPotBalls) : 0;
  const submittedFoulPoints = foulPoints || inferredFreeBallFoulPoints;
  const hasSelectedBalls = foulMode
    ? foulBall !== null
    : multiPotBalls.length > 0 || foulBall !== null;
  const selectedBalls = foulMode
    ? [...multiPotBalls, ...(foulBall && foulBall !== "red" ? [foulBall] : [])]
    : multiPotBalls;
  const isRedFoulWithoutPot =
    foulMode && foulBall === "red" && redSelections === 0;

  const comboStatusChip = (() => {
    if (foulMode) {
      return foulBall
        ? { label: `FOUL ${foulPoints}`, color: "danger" as const }
        : null;
    }

    if (foulBall) {
      return { label: `FOUL ${foulPoints}`, color: "danger" as const };
    }

    if (comboIsFoul) {
      return {
        label: inferredFreeBallFoulPoints
          ? `FOUL ${inferredFreeBallFoulPoints}`
          : "FOUL",
        color: "danger" as const,
      };
    }

    return multiPotBalls.length > 0
      ? { label: "LEGAL", color: "success" as const }
      : null;
  })();

  const redPotSummary = formatPottedReds(redSelections);

  const advancedSummary = (() => {
    if (foulMode) {
      if (foulBall === "red" && redSelections === 0) {
        return "Foul on a red (no pot)";
      }

      if (foulBall === "red" && redSelections > 0) {
        return `Foul with ${redPotSummary}`;
      }

      if (foulBall && redSelections > 0) {
        return `Foul on ${foulBall} with ${redPotSummary}`;
      }

      if (foulBall) {
        return `Foul on ${foulBall}`;
      }

      return "Tap the ball fouled on";
    }

    if (foulBall) {
      return `Foul on ${foulBall}`;
    }

    if (multiPotBalls.length > 0) {
      return `Pot ${comboSummary}`;
    }

    return "Tap the balls potted";
  })();

  const enterAdvancedMode = (beforeEnter?: () => void) => {
    beforeEnter?.();
    setIsAdvancedMode(true);
  };

  const cancelAdvancedMode = () => {
    setMultiPotBalls([]);
    setFoulBall(null);
    setFoulMode(false);
    setFreeBallMode(false);
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
        setRedCount(0);
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

    if (freeBallMode) {
      if (ball !== "red" && coloursOnTable[ball]) {
        sendDeclareFreeBall(ball);
        setFreeBallMode(false);
      }

      return;
    }

    if (isAdvancedMode) {
      if (foulMode) {
        if (ball === "red") {
          if (foulBall === null && redSelections === 0) {
            setFoulBall("red");
            return;
          }

          toggleMultiBall(ball);
          return;
        }

        if (coloursOnTable[ball]) {
          setFoulBall((prev) => (prev === ball ? null : ball));
        }

        return;
      }

      if (ball === "red") {
        toggleMultiBall(ball);
        return;
      }

      toggleMultiBall(ball);
      return;
    }

    const legalSingle = isLegalShot([ball], objectBall, redsRemaining, freeBall);
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
    setFreeBallMode(false);
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

    sendShot(multiPotBalls, submittedFoulPoints);
    cancelAdvancedMode();
  };

  const startFreeBallMode = () => {
    if (!canUseFoulOptions) {
      return;
    }

    setMultiPotBalls([]);
    setFoulBall(null);
    setFoulMode(false);
    setIsAdvancedMode(false);
    setFreeBallMode((prev) => !prev);
  };

  const startAdvancedMode = () => {
    enterAdvancedMode(() => {
      setFoulMode(false);
      setFoulBall(null);
      setMultiPotBalls([]);
    });
  };

  return {
    advancedSummary,
    comboIsFoul,
    comboStatusChip,
    freeBallMode,
    foulMode,
    hasSelectedBalls,
    isAdvancedMode,
    multiPotBalls,
    redSelections,
    selectedBalls,
    isRedFoulWithoutPot,
    cancelAdvancedMode,
    handleBallTap,
    resetRedSelections,
    startAdvancedMode,
    startFreeBallMode,
    submitComposer,
    toggleFoulMode,
  };
}
