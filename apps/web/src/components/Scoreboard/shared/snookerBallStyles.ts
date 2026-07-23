import { BallName } from "@/domain/balls";

export const SNOOKER_BALL_SURFACE_CLASS =
  "relative isolate overflow-hidden shadow-inner before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-full before:bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.7)_25%,rgba(255,255,255,0)_50%)]";

export const SNOOKER_BALL_CLASS: Record<BallName, string> = {
  red: "bg-red-500 hover:bg-red-600",
  yellow: "bg-yellow-400 hover:bg-yellow-500",
  green: "bg-green-500 hover:bg-green-600",
  brown: "bg-amber-800 hover:bg-amber-900",
  blue: "bg-blue-500 hover:bg-blue-600",
  pink: "bg-pink-400 hover:bg-pink-500",
  black: "bg-slate-950 hover:bg-black",
};

export function getSnookerBallClass(ball: string) {
  return SNOOKER_BALL_CLASS[ball as BallName] ?? "bg-default";
}

export function getSnookerBallTextClass(ball: string) {
  return ball === "yellow" ? "text-slate-950" : "text-white";
}
