import type { ReactNode } from "react";

import {
  getSnookerBallClass,
  getSnookerBallTextClass,
  SNOOKER_BALL_SURFACE_CLASS,
} from "./snookerBallStyles";

type SnookerBallTokenProps = {
  ball: string;
  label: string;
  children?: ReactNode;
};

export default function SnookerBallToken({
  ball,
  label,
  children,
}: SnookerBallTokenProps) {
  return (
    <span
      aria-label={label}
      className={`flex h-6 w-6 items-center justify-center rounded-full ${SNOOKER_BALL_SURFACE_CLASS} ${getSnookerBallClass(
        ball,
      )} ${getSnookerBallTextClass(ball)}`}
    >
      <span className="relative z-10">{children}</span>
    </span>
  );
}
