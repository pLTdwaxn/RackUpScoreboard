import { Frame } from "@/types";
import { BALL_BY_NAME, BALL_NAMES, BallName } from "@/domain/balls";
import {
  SNOOKER_BALL_CLASS,
  SNOOKER_BALL_SURFACE_CLASS,
} from "@/components/Scoreboard/shared/snookerBallStyles";

export const ALL_BALLS = BALL_NAMES;
export const BALL_CLASS = SNOOKER_BALL_CLASS;
export const BALL_SURFACE_CLASS = SNOOKER_BALL_SURFACE_CLASS;

export function countSelectedBalls(selectedBalls: BallName[]) {
  return selectedBalls.reduce<Record<string, number>>((acc, ball) => {
    acc[ball] = (acc[ball] ?? 0) + 1;
    return acc;
  }, {});
}

export function isBallLegal({
  ball,
  objectBall,
  redsRemaining,
  coloursOnTable,
  freeBall,
}: {
  ball: BallName;
  objectBall: Frame["object_ball"];
  redsRemaining: number | null;
  coloursOnTable: Frame["colours_on_table"];
  freeBall: Frame["free_ball"];
}) {
  if (freeBall) {
    return ball === freeBall.nominated_colour && coloursOnTable[ball];
  }

  if (ball === "red") {
    return objectBall === "red" && (redsRemaining === null || redsRemaining > 0);
  }

  if (!coloursOnTable[ball]) {
    return false;
  }

  if (objectBall === "colour") {
    return true;
  }

  return objectBall === ball;
}

export function ballPoints(ball: BallName, freeBall: Frame["free_ball"]) {
  if (
    freeBall &&
    ball === freeBall.nominated_colour &&
    freeBall.object_ball !== "colour"
  ) {
    return BALL_BY_NAME[freeBall.object_ball as BallName].points;
  }

  return BALL_BY_NAME[ball].points;
}
