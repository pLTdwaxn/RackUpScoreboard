import { Player } from "@/types";

export function resolvePlayerPair(
  players: Player[],
  currentPlayerKey: string,
): {
  me: Player | undefined;
  opponent: Player | undefined;
} {
  const me = players.find((player) => player.session_key === currentPlayerKey);
  const opponent = players.find(
    (player) => player.session_key !== currentPlayerKey,
  );

  return { me, opponent };
}

export function resolvePlayerPairWithScores(
  players: Player[],
  currentPlayerKey: string,
  scores: Record<string, number>,
): {
  me: Player | undefined;
  opponent: Player | undefined;
  myScore: number;
  opponentScore: number;
} {
  const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);

  return {
    me,
    opponent,
    myScore: scores[currentPlayerKey] ?? 0,
    opponentScore: opponent ? (scores[opponent.session_key] ?? 0) : 0,
  };
}
