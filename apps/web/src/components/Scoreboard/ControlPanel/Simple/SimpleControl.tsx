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
import { BALL_BY_NAME, BallName } from "@/lib/controlPanelShared";

import ControlPanelLayout from "../ControlPanelLayout";
import {
  ALL_BALLS,
  BALL_CLASS,
  countSelectedBalls,
  isBallLegal,
} from "../shared/ballRail";

type SimpleBallRailProps = {
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: Frame["object_ball"];
  freeBall: Frame["free_ball"];
  canKeepScore: boolean;
  freeBallMode?: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
};

export function SimpleBallRail({
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  canKeepScore,
  freeBallMode = false,
  selectedBalls,
  onBallTap,
}: SimpleBallRailProps) {
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
        const picked = (selectedBallCounts[ball] ?? 0) > 0;
        const unavailable =
          ball === "red" ? redsRemaining <= 0 : !coloursOnTable[ball];
        const isDisabled =
          !canKeepScore ||
          (freeBallMode ? ball === "red" || unavailable : unavailable);

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
  canUseFoulOptions: boolean;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

export function SimpleBottomActions({
  canKeepScore,
  canUseFoulOptions,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
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
          <Button
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onPassShot}
          >
            <ButtonGroup.Separator />
            <IconPlayerSkipForward stroke={2} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onDeclareFreeBall}
          >
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
