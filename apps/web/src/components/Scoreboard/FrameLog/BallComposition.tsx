const BALL_CLASS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  brown: "bg-amber-800",
  blue: "bg-blue-500",
  pink: "bg-pink-400",
  black: "bg-slate-950",
};

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
    <div className="flex min-w-0 items-center gap-1 overflow-hidden px-2">
      {composition.map(({ ball, count }, index) => (
        <span
          key={`${entryId}-${index}-${ball}`}
          aria-label={count > 1 ? `${count} ${ball}` : ball}
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            BALL_CLASS[ball] ?? "bg-default"
          } ${ball === "yellow" ? "text-slate-950" : "text-white"}`}
        >
          {count > 1 ? count : null}
        </span>
      ))}
    </div>
  );
}
