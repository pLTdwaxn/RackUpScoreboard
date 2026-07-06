import { Player } from "@/types";

export function resolvePlayerPair(players: Player[], currentPlayerKey: string): {
  me: Player | undefined;
  opponent: Player | undefined;
} {
  const me = players.find((player) => player.key === currentPlayerKey);
  const opponent = players.find((player) => player.key !== currentPlayerKey);

  return { me, opponent };
}
