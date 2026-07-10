import { Card, Description } from "@heroui/react";

import { Match, Player } from "@/types";
import { Frame } from "@/types";

import { PlayerCard } from ".";
import { resolvePlayerPair } from "./playerIdentity";

export default function MatchOverview({
  match,
  frame,
  players,
  currentPlayerKey,
}: {
  match: Match;
  frame: Frame;
  players: Player[];
  currentPlayerKey: string;
}) {
  const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);
  const winningPlayerKey =
    frame.status === "finished" ? frame.winner_key : null;

  return (
    <Card
      variant="transparent"
      className="flex flex-col w-full p-0 max-w-md rounded-3xl gap-2"
    >
      {/* <Card.Header className="items-center uppercase text-sm font-bold tracking-widest">
        <h2>{match.match_importance}</h2>
        <Description>First to {match.frames_to_win}</Description>
      </Card.Header> */}
      <Card.Content className="flex flex-row gap-2">
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
      </Card.Content>
    </Card>
  );
}
