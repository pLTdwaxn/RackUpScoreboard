import { Card } from "@heroui/react";

import { Match, Player as PlayerType } from "@/types";

import { Player } from ".";
import { resolvePlayerPair } from "./playerIdentity";

export default function MatchOverview({
  match,
  players,
  currentPlayerKey,
}: {
  match: Match;
  players: PlayerType[];
  currentPlayerKey: string;
}) {
  const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);

  return (
    <Card
      variant="transparent"
      className="flex flex-col w-full p-0 max-w-md rounded-xl gap-2"
    >
      <Card.Header className="items-center uppercase text-sm font-bold tracking-widest">
        <h2>
          {match.match_importance} - {match.winning_condition}
        </h2>
      </Card.Header>
      <Card.Content className="flex flex-row gap-2">
        {opponent ? <Player player={opponent} /> : null}
        {me ? <Player player={me} direction="rtl" /> : null}
      </Card.Content>
    </Card>
  );
}
