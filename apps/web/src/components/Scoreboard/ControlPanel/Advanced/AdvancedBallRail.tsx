import { useRef } from "react";

import { Badge, Button } from "@heroui/react";

import { Frame } from "@/types";
import { BALL_BY_NAME, BallName } from "@/lib/controlPanelShared";

import {
  ALL_BALLS,
  BALL_CLASS,
  ballPoints,
  countSelectedBalls,
  isBallLegal,
} from "../shared/ballRail";

type AdvancedBallRailProps = {
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: string;
  freeBall: Frame["free_ball"];
  canKeepScore: boolean;
  redSelections: number;
  selectedBalls: BallName[];
  isRedFoulWithoutPot: boolean;
  onBallTap: (ball: BallName) => void;
  onRedLongPress: () => void;
  foulMode: boolean;
  comboIsFoul?: boolean;
};

export default function AdvancedBallRail({
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  canKeepScore,
  redSelections,
  selectedBalls,
  isRedFoulWithoutPot,
  onBallTap,
  onRedLongPress,
  foulMode,
  comboIsFoul,
}: AdvancedBallRailProps) {
  const redPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redLongPressTriggeredRef = useRef(false);

  const clearRedPressTimer = () => {
    if (redPressTimerRef.current) {
      clearTimeout(redPressTimerRef.current);
      redPressTimerRef.current = null;
    }
  };

  const handleRedPointerDown = () => {
    redLongPressTriggeredRef.current = false;
    clearRedPressTimer();
    redPressTimerRef.current = setTimeout(() => {
      redLongPressTriggeredRef.current = true;
      onRedLongPress();
    }, 450);
  };

  const handleBallPress = (ball: BallName) => {
    if (ball === "red" && redLongPressTriggeredRef.current) {
      redLongPressTriggeredRef.current = false;
      return;
    }

    onBallTap(ball);
  };

  const selectedBallCounts = countSelectedBalls(selectedBalls);

  return (
    <div className="flex w-full flex-row items-stretch justify-between gap-1">
      {ALL_BALLS.map((ball) => {
        const legal = isBallLegal({
          ball,
          objectBall,
          redsRemaining,
          coloursOnTable,
          freeBall,
        });
        const picked =
          ball === "red"
            ? redSelections > 0 || isRedFoulWithoutPot
            : (selectedBallCounts[ball] ?? 0) > 0;
        const unavailable =
          ball === "red"
            ? redsRemaining <= 0 && redSelections === 0
            : !coloursOnTable[ball];
        const isDisabled = !canKeepScore || unavailable;

        const badgeColor = () => {
          if (foulMode) {
            if (picked) {
              return "danger";
            }
            return "warning";
          }

          if (comboIsFoul) {
            if (picked) {
              return "danger";
            }
            return "warning";
          }

          if (picked) {
            return legal ? "accent" : "danger";
          }

          if (unavailable) {
            return "default";
          }

          return legal ? "success" : "warning";
        };

        const foulPoints = BALL_BY_NAME[ball].penaltyPoints;
        const potPoints = ballPoints(ball, freeBall);

        const badgeLabel = () => {
          if (foulMode) {
            return foulPoints;
          }

          if (comboIsFoul) {
            return foulPoints;
          }

          if (picked) {
            return legal ? potPoints : foulPoints;
          }

          if (unavailable) {
            return "";
          }

          return legal ? potPoints : foulPoints;
        };

        return (
          <Badge.Anchor key={ball}>
            <Button
              aria-label={ball}
              isIconOnly
              isDisabled={isDisabled}
              onPress={() => handleBallPress(ball)}
              onPointerDown={ball === "red" ? handleRedPointerDown : undefined}
              onPointerUp={ball === "red" ? clearRedPressTimer : undefined}
              onPointerLeave={ball === "red" ? clearRedPressTimer : undefined}
              onPointerCancel={ball === "red" ? clearRedPressTimer : undefined}
              size="lg"
              type="button"
              className={BALL_CLASS[ball]}
            >
              {ball === "red"
                ? isRedFoulWithoutPot
                  ? "-"
                  : redSelections || null
                : null}
            </Button>
            <Badge
              className="font-bold"
              placement="bottom-right"
              size="sm"
              color={badgeColor()}
            >
              {badgeLabel()}
            </Badge>
          </Badge.Anchor>
        );
      })}
    </div>
  );
}
