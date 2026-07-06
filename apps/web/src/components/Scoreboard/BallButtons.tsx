import { Badge, Button } from "@heroui/react";

import { TableState } from "@/types";

type BallButtonsProps = {
  redsRemaining: number;
  coloursOnTable: TableState["colours_on_table"];
  objectBall: string;
  canKeepScore: boolean;
  sendPot: (color: string) => void;
};

type BallName =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black";

const BALL_CLASS: Record<BallName, string> = {
  red: "bg-red-400 hover:bg-red-500",
  yellow: "bg-yellow-400 hover:bg-yellow-500",
  green: "bg-green-400 hover:bg-green-500",
  brown: "bg-amber-700 hover:bg-amber-800",
  blue: "bg-blue-400 hover:bg-blue-500",
  pink: "bg-pink-400 hover:bg-pink-500",
  black: "bg-slate-900 hover:bg-slate-950",
};

const ALL_BALLS: BallName[] = [
  "red",
  "yellow",
  "green",
  "brown",
  "blue",
  "pink",
  "black",
];

function isBallLegal(
  ball: BallName,
  objectBall: string,
  redsRemaining: number,
  coloursOnTable: Record<string, boolean>,
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

export default function BallButtons({
  redsRemaining,
  coloursOnTable,
  objectBall,
  canKeepScore,
  sendPot,
}: BallButtonsProps) {
  return (
    <div className="flex w-full flex-row items-stretch justify-between">
      {ALL_BALLS.map((ball) => {
        const legal = isBallLegal(
          ball,
          objectBall,
          redsRemaining,
          coloursOnTable,
        );
        return (
          <Badge.Anchor key={ball}>
            <Button
              aria-label={ball}
              isIconOnly={true}
              isDisabled={!canKeepScore || !legal}
              onPress={() => sendPot(ball)}
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
              color={legal ? "success" : "warning"}
            />
          </Badge.Anchor>
        );
      })}
    </div>
  );
}
