import { Frame } from "@/types";
import { BALL_BY_NAME, BallName } from "@/domain/balls";

export function isLegalShot(
  pottedBalls: BallName[],
  objectBall: Frame["object_ball"],
  redsRemaining: number,
  freeBall: Frame["free_ball"],
) {
  if (pottedBalls.length === 0) {
    return false;
  }

  const nominatedColour = freeBall?.nominated_colour as BallName | undefined;
  if (freeBall && !pottedBalls.includes(nominatedColour as BallName)) {
    return false;
  }

  const equivalentBalls = pottedBalls.map((ball) =>
    freeBall && ball === nominatedColour ? freeBall.object_ball : ball,
  );

  if (objectBall === "red") {
    const redLimit = redsRemaining + (freeBall ? 1 : 0);
    return (
      equivalentBalls.every((ball) => ball === "red") &&
      equivalentBalls.length <= redLimit
    );
  }

  if (objectBall === "colour") {
    return equivalentBalls.length === 1 && equivalentBalls[0] !== "red";
  }

  return equivalentBalls.length === 1 && equivalentBalls[0] === objectBall;
}

export function inferFoulPoints(pottedBalls: BallName[]) {
  return Math.max(
    4,
    ...pottedBalls.map((ball) => BALL_BY_NAME[ball].penaltyPoints),
  );
}

export function summarizeBalls(pottedBalls: BallName[]) {
  const counts = pottedBalls.reduce<Record<string, number>>((acc, ball) => {
    acc[ball] = (acc[ball] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([ball, count]) => `${count} ${ball}`)
    .join(", ");
}
