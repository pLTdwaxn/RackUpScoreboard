export type BallName =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black";

export type Ball = {
  name: BallName;
  points: number;
  penaltyPoints: number;
};

export const BALLS: Ball[] = [
  { name: "red", points: 1, penaltyPoints: 4 },
  { name: "yellow", points: 2, penaltyPoints: 4 },
  { name: "green", points: 3, penaltyPoints: 4 },
  { name: "brown", points: 4, penaltyPoints: 4 },
  { name: "blue", points: 5, penaltyPoints: 5 },
  { name: "pink", points: 6, penaltyPoints: 6 },
  { name: "black", points: 7, penaltyPoints: 7 },
];

export const BALL_NAMES = BALLS.map((ball) => ball.name);

export const BALL_BY_NAME = Object.fromEntries(
  BALLS.map((ball) => [ball.name, ball]),
) as Record<BallName, Ball>;
