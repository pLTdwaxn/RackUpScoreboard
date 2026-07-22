import { Frame } from "@/types";
import { BALL_BY_NAME, BALL_NAMES, BallName } from "@/domain/balls";

export const ALL_BALLS = BALL_NAMES;

export const BALL_CLASS: Record<BallName, string> = {
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
  redsRemaining: Frame["reds_remaining"];
  coloursOnTable: Frame["colours_on_table"];
  freeBall: Frame["free_ball"];
}) {
  if (freeBall) {
    return ball === freeBall.nominated_colour && coloursOnTable[ball];
  }

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
