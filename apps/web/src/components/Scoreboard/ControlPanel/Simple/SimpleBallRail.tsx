import { Badge, Button } from "@heroui/react";

import { Frame } from "@/types";
import { BALL_BY_NAME, BallName } from "@/domain/balls";

import {
  ALL_BALLS,
  BALL_CLASS,
  BALL_SURFACE_CLASS,
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

export default function SimpleBallRail({
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
              className={`${BALL_SURFACE_CLASS} ${BALL_CLASS[ball]}`}
            >
              <span className="relative z-10">
                {ball === "red" && redsRemaining}
              </span>
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
