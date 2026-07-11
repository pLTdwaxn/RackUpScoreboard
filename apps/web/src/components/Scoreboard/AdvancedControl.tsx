import { useRef, type ReactNode } from "react";

import { Badge, Button } from "@heroui/react";
import { IconCheck, IconX } from "@tabler/icons-react";

import { TableState } from "@/types";
import { BALL_BY_NAME, BALL_NAMES, BallName } from "@/lib/controlPanelShared";

import ControlPanelLayout from "./ControlPanelLayout";

const BALL_CLASS: Record<BallName, string> = {
  red: "bg-gradient-to-br from-red-300 to-red-500 hover:from-red-400 hover:to-red-600",
  yellow:
    "bg-gradient-to-br from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600",
  green:
    "bg-gradient-to-br from-green-300 to-green-500 hover:from-green-400 hover:to-green-600",
  brown:
    "bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900",
  blue: "bg-gradient-to-br from-blue-300 to-blue-500 hover:from-blue-400 hover:to-blue-600",
  pink: "bg-gradient-to-br from-pink-300 to-pink-500 hover:from-pink-400 hover:to-pink-600",
  black:
    "bg-gradient-to-br from-slate-700 to-slate-950 hover:from-slate-800 hover:to-black",
};

const ALL_BALLS = BALL_NAMES;

function isBallLegal(
  ball: BallName,
  objectBall: string,
  redsRemaining: number,
  coloursOnTable: TableState["colours_on_table"],
): boolean {
  if (ball === "red") {
    return objectBall === "red" && redsRemaining > 0;
  }

  if (!coloursOnTable[ball]) {
    return false;
  }

  if (objectBall === "colour") {
    return true;
  }

  return objectBall === ball;
}

type AdvancedBallRailProps = {
  redsRemaining: number;
  coloursOnTable: TableState["colours_on_table"];
  objectBall: string;
  canKeepScore: boolean;
  redSelections: number;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
  onRedLongPress: () => void;
  showFoulPoints?: boolean;
  foulMode: boolean;
  comboIsFoul?: boolean;
};

export function AdvancedBallRail({
  redsRemaining,
  coloursOnTable,
  objectBall,
  canKeepScore,
  redSelections,
  selectedBalls,
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

  const selectedBallCounts = selectedBalls.reduce<Record<string, number>>(
    (acc, ball) => {
      acc[ball] = (acc[ball] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="flex w-full flex-row items-stretch justify-between gap-1">
      {ALL_BALLS.map((ball) => {
        const legal = isBallLegal(
          ball,
          objectBall,
          redsRemaining,
          coloursOnTable,
        );
        const picked =
          ball === "red"
            ? redSelections > 0
            : (selectedBallCounts[ball] ?? 0) > 0;
        const unavailable =
          ball === "red"
            ? redsRemaining <= 0 || redSelections >= redsRemaining
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
        const potPoints = BALL_BY_NAME[ball].points;

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
              {ball === "red" ? redSelections : null}
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

type AdvancedControlProps = {
  messageRow: ReactNode;
  ballRow: ReactNode;
  actionsRow: ReactNode;
};

export default function AdvancedControl({
  messageRow,
  ballRow,
  actionsRow,
}: AdvancedControlProps) {
  return (
    <ControlPanelLayout
      messageRow={messageRow}
      ballRow={ballRow}
      actionsRow={actionsRow}
    />
  );
}

export type AdvancedBottomActionsProps = {
  canKeepScore: boolean;
  foulMode: boolean;
  comboIsFoul: boolean;
  hasSelectedBalls: boolean;
  onExitAdvancedMode: () => void;
  onChangeFoulMode: (isFoulMode: boolean) => void;
  onSubmit: () => void;
};

export function AdvancedBottomActions({
  canKeepScore,
  foulMode,
  comboIsFoul,
  hasSelectedBalls,
  onExitAdvancedMode,
  onChangeFoulMode,
  onSubmit,
}: AdvancedBottomActionsProps) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <div>
        <Button
          variant={foulMode ? "danger" : "outline"}
          onPress={() => {
            onChangeFoulMode(!foulMode);
          }}
          size="sm"
        >
          {foulMode ? "Foul Declaring On" : "Foul Declaring Off"}
        </Button>
      </div>
      <div></div>
      <div className="flex flex-wrap gap-1">
        <Button
          isIconOnly
          variant={foulMode || comboIsFoul ? "danger" : "primary"}
          isDisabled={!canKeepScore || !hasSelectedBalls}
          onPress={onSubmit}
          size="sm"
        >
          <IconCheck stroke={2} />
        </Button>
        <Button
          isIconOnly
          variant="secondary"
          onPress={onExitAdvancedMode}
          size="sm"
        >
          <IconX stroke={2} />
        </Button>
      </div>
    </div>
  );
}
