import type { ReactNode } from "react";

import {
  getSnookerBallClass,
  getSnookerBallTextClass,
} from "./snookerBallStyles";

type SnookerBallTokenProps = {
  ball: string;
  effectiveBall?: string;
  label: string;
  size?: "sm" | "md";
  children?: ReactNode;
};

export default function SnookerBallToken({
  ball,
  effectiveBall,
  label,
  size = "sm",
  children,
}: SnookerBallTokenProps) {
  const sizeClass = size === "md" ? "h-10 w-10 text-base" : "h-6 w-6 text-sm";
  const innerInsetClass = size === "md" ? "inset-[5px]" : "inset-[3px]";

  return (
    <span
      aria-label={label}
      className={`relative isolate flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full shadow-inner before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-full before:bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.7)_25%,rgba(255,255,255,0)_50%)] ${getSnookerBallClass(
        effectiveBall ?? ball,
      )} ${getSnookerBallTextClass(ball)}`}
    >
      {effectiveBall ? (
        <span
          className={`absolute ${innerInsetClass} z-0 rounded-full ${getSnookerBallClass(
            ball,
          )}`}
        />
      ) : null}
      <span className="relative z-20">{children}</span>
    </span>
  );
}
