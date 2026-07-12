import type { ReactNode } from "react";

import { Badge, Button, ButtonGroup } from "@heroui/react";
import {
  IconAdjustmentsAlt,
  IconArrowsRightLeft,
  IconBan,
  IconChartCircles,
  IconFlagFilled,
  IconPlayerSkipForward,
} from "@tabler/icons-react";

import { Frame } from "@/types";
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
  objectBall: Frame["object_ball"],
  redsRemaining: number,
  coloursOnTable: Frame["colours_on_table"],
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

type SimpleBallRailProps = {
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: Frame["object_ball"];
  canKeepScore: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
};

export function SimpleBallRail({
  redsRemaining,
  coloursOnTable,
  objectBall,
  canKeepScore,
  selectedBalls,
  onBallTap,
}: SimpleBallRailProps) {
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
        const picked = (selectedBallCounts[ball] ?? 0) > 0;
        const unavailable =
          ball === "red" ? redsRemaining <= 0 : !coloursOnTable[ball];
        const isDisabled = !canKeepScore || unavailable;

        const badgeColor = picked
          ? legal
            ? "success"
            : "danger"
          : unavailable
            ? "default"
            : legal
              ? "success"
              : "warning";
        const penaltyPoints = BALL_BY_NAME[ball].penaltyPoints;

        return (
          <Badge.Anchor key={ball}>
            <Button
              aria-label={ball}
              isIconOnly
              isDisabled={isDisabled}
              onPress={() => onBallTap(ball)}
              size="lg"
              type="button"
              className={BALL_CLASS[ball]}
            >
              {ball === "red" && redsRemaining}
            </Button>
            <Badge
              className="font-bold"
              placement="bottom-right"
              size="sm"
              color={badgeColor}
            >
              {picked && !legal ? penaltyPoints : ""}
            </Badge>
          </Badge.Anchor>
        );
      })}
    </div>
  );
}

export type SimpleControlProps = {
  messageRow?: ReactNode;
  ballRow: ReactNode;
  actionsRow: ReactNode;
};

export default function SimpleControl({
  messageRow,
  ballRow,
  actionsRow,
}: SimpleControlProps) {
  return (
    <ControlPanelLayout
      messageRow={messageRow}
      ballRow={ballRow}
      actionsRow={actionsRow}
    />
  );
}

export type SimpleBottomActionsProps = {
  canKeepScore: boolean;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onUndo: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

export function SimpleBottomActions({
  canKeepScore,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
  onUndo,
  onPassShot,
  onDeclareFreeBall,
}: SimpleBottomActionsProps) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="justify-self-start">
        <ButtonGroup size="sm">
          <Button isIconOnly variant="danger" size="sm" onPress={onConcede}>
            <IconFlagFilled stroke={2} />
          </Button>
        </ButtonGroup>
      </div>

      <div className="justify-self-center">
        <ButtonGroup variant="secondary" size="sm">
          <Button isIconOnly isDisabled={!canKeepScore} onPress={onEndTurn}>
            <IconArrowsRightLeft stroke={2} />
          </Button>
          <Button isIconOnly size="sm" onPress={onPassShot}>
            <ButtonGroup.Separator />
            <IconPlayerSkipForward stroke={2} />
          </Button>
          <Button isIconOnly size="sm" onPress={onDeclareFreeBall}>
            <ButtonGroup.Separator />
            <IconChartCircles stroke={2} />
          </Button>
          <Button
            isIconOnly
            variant="danger-soft"
            isDisabled={!canKeepScore}
            onPress={onDeclareFoul}
          >
            <ButtonGroup.Separator />
            <IconBan stroke={2} />
          </Button>
        </ButtonGroup>
      </div>

      <div className="justify-self-end">
        <ButtonGroup variant="secondary" size="sm">
          <Button
            isDisabled={!canKeepScore}
            variant="secondary"
            isIconOnly
            onPress={onEnterAdvancedMode}
            size="sm"
          >
            <IconAdjustmentsAlt stroke={2} />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
