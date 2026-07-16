import { Player as PlayerType } from "@/types";

type PlayerNameProps = {
  player: PlayerType;
  reverseDirection: boolean;
};

export default function PlayerName({
  player,
  reverseDirection,
}: PlayerNameProps) {
  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
      <h2
        className={`truncate font-mono font-normal tracking-wider uppercase ${
          reverseDirection ? "text-right" : "text-left"
        }`}
      >
        {player.name}
      </h2>
    </div>
  );
}
