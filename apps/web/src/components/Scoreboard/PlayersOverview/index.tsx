"use client";

import { useMatchroomDerivedState } from "@/hooks/useSocket";

import OverviewWrapper from "./OverviewWrapper";
import PlayerPairDisplay from "./PlayerPairDisplay";

export { default as OverviewWrapper } from "./OverviewWrapper";
export { default as PlayerPairDisplay } from "./PlayerPairDisplay";
export { default as PlayerCard } from "./PlayerCard";

export default function PlayersOverview() {
  const { hasFrame, me, opponent, winningPlayerKey } =
    useMatchroomDerivedState();

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <PlayerPairDisplay
        me={me}
        opponent={opponent}
        winningPlayerKey={winningPlayerKey}
      />
    </OverviewWrapper>
  );
}
