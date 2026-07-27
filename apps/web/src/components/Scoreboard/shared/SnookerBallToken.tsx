import type { ReactNode } from "react";

import {
  getSnookerBallClass,
  getSnookerBallTextClass,
} from "./snookerBallStyles";

type SnookerBallTokenProps = {
  ball: string;
  effectiveBall?: string;
  label: string;
  children?: ReactNode;
};

export default function SnookerBallToken({
  ball,
  effectiveBall,
  label,
  children,
}: SnookerBallTokenProps) {
  return (
    <span
      aria-label={label}
      className={`relative isolate flex h-6 w-6 items-center justify-center overflow-hidden rounded-full shadow-inner before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-full before:bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.7)_25%,rgba(255,255,255,0)_50%)] ${getSnookerBallClass(
        effectiveBall ?? ball,
      )} ${getSnookerBallTextClass(ball)}`}
    >
      {effectiveBall ? (
        <span
          className={`absolute inset-[3px] z-0 rounded-full ${getSnookerBallClass(
            ball,
          )}`}
        />
      ) : null}
      <span className="relative z-20">{children}</span>
    </span>
  );
}
