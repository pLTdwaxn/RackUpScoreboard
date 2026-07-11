import { Player } from "@/types";

import PlayerCard from "./PlayerCard";

type PlayerPairDisplayProps = {
  me: Player | undefined;
  opponent: Player | undefined;
  winningPlayerKey: string | null;
};

export default function PlayerPairDisplay({
  me,
  opponent,
  winningPlayerKey,
}: PlayerPairDisplayProps) {
  return (
    <>
      {opponent ? (
        <PlayerCard
          player={opponent}
          isFrameWinner={opponent.session_key === winningPlayerKey}
        />
      ) : null}
      {me ? (
        <PlayerCard
          player={me}
          direction="rtl"
          isFrameWinner={me.session_key === winningPlayerKey}
        />
      ) : null}
    </>
  );
}
