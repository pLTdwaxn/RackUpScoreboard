import SnookerBallToken from "@/components/Scoreboard/shared/SnookerBallToken";
import { FreeBallPot } from "@/types";

type BallGroup = {
  ball: string;
  count: number;
  effectiveBall?: string;
};

type BallCompositionProps = {
  entryId: string;
  pottedBalls: string[];
  freeBallPots?: FreeBallPot[];
  tokenSize?: "sm" | "md";
};

function groupPottedBalls(pottedBalls: string[]): BallGroup[] {
  const redCount = pottedBalls.filter((ball) => ball === "red").length;
  const composition = redCount > 0 ? [{ ball: "red", count: redCount }] : [];

  for (const ball of pottedBalls) {
    if (ball === "red") {
      continue;
    }

    const previous = composition.at(-1);
    if (previous?.ball === ball) {
      previous.count += 1;
      continue;
    }

    composition.push({ ball, count: 1 });
  }

  return composition;
}

function removeFirstMatchingBall(pottedBalls: string[], ballToRemove: string): string[] {
  let hasRemoved = false;

  return pottedBalls.filter((ball) => {
    if (!hasRemoved && ball === ballToRemove) {
      hasRemoved = true;
      return false;
    }

    return true;
  });
}

function groupPottedBallsWithFreeBalls(
  pottedBalls: string[],
  freeBallPots: FreeBallPot[],
): BallGroup[] {
  const substitutedRed = freeBallPots.find((pot) => pot.counts_as === "red");
  if (substitutedRed) {
    const remainingBalls = removeFirstMatchingBall(
      pottedBalls,
      substitutedRed.potted_ball,
    );

    return [
      {
        ball: substitutedRed.potted_ball,
        count: 1,
        effectiveBall: substitutedRed.counts_as,
      },
      ...groupPottedBalls(remainingBalls),
    ];
  }

  const remainingFreeBallPots = [...freeBallPots];
  const composition: BallGroup[] = [];

  for (const ball of pottedBalls) {
    const freeBallPotIndex = remainingFreeBallPots.findIndex(
      (pot) => pot.potted_ball === ball,
    );
    const freeBallPot =
      freeBallPotIndex >= 0
        ? remainingFreeBallPots.splice(freeBallPotIndex, 1)[0]
        : undefined;

    if (freeBallPot) {
      composition.push({
        ball,
        count: 1,
        effectiveBall: freeBallPot.counts_as,
      });
      continue;
    }

    const previous = composition.at(-1);
    if (!previous?.effectiveBall && previous?.ball === ball) {
      previous.count += 1;
      continue;
    }

    composition.push({ ball, count: 1 });
  }

  return composition;
}

export default function BallComposition({
  entryId,
  pottedBalls,
  freeBallPots = [],
  tokenSize = "sm",
}: BallCompositionProps) {
  const composition =
    freeBallPots.length > 0
      ? groupPottedBallsWithFreeBalls(pottedBalls, freeBallPots)
      : groupPottedBalls(pottedBalls);

  if (composition.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center ${
        tokenSize === "md" ? "gap-2" : "gap-1"
      } px-1`}
    >
      {composition.map(({ ball, count }, index) => (
        <SnookerBallToken
          key={`${entryId}-${index}-${ball}`}
          ball={ball}
          effectiveBall={composition[index].effectiveBall}
          size={tokenSize}
          label={
            composition[index].effectiveBall
              ? `${ball} counts as ${composition[index].effectiveBall}`
              : count > 1
                ? `${count} ${ball}`
                : ball
          }
        >
          {count > 1 ? count : null}
        </SnookerBallToken>
      ))}
    </div>
  );
}
