import SnookerBallToken from "@/components/Scoreboard/shared/SnookerBallToken";

type BallGroup = {
  ball: string;
  count: number;
};

type BallCompositionProps = {
  entryId: string;
  pottedBalls: string[];
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

export default function BallComposition({
  entryId,
  pottedBalls,
}: BallCompositionProps) {
  const composition = groupPottedBalls(pottedBalls);

  if (composition.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden px-1">
      {composition.map(({ ball, count }, index) => (
        <SnookerBallToken
          key={`${entryId}-${index}-${ball}`}
          ball={ball}
          label={count > 1 ? `${count} ${ball}` : ball}
        >
          {count > 1 ? count : null}
        </SnookerBallToken>
      ))}
    </div>
  );
}
