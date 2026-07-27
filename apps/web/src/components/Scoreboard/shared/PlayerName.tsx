import { Player as PlayerType } from "@/types";
import {
  getPlayerNameThemeStyle,
  PlayerAvatarTheme,
} from "./playerIdentity";

type PlayerNameTextProps = {
  name: string;
  theme?: PlayerAvatarTheme;
  className?: string;
};

type PlayerNameProps = {
  player: PlayerType;
  reverseDirection: boolean;
  theme?: PlayerAvatarTheme;
};

export function PlayerNameText({
  name,
  theme = "neutral",
  className = "",
}: PlayerNameTextProps) {
  return (
    <span
      className={`font-medium text-[var(--player-name-color)] ${className}`}
      style={getPlayerNameThemeStyle(theme)}
    >
      {name}
    </span>
  );
}

export default function PlayerName({
  player,
  reverseDirection,
  theme = "neutral",
}: PlayerNameProps) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-1">
      <h2
        className={`truncate font-mono font-normal tracking-wider uppercase ${
          reverseDirection ? "text-right" : "text-left"
        }`}
      >
        <PlayerNameText
          name={player.name}
          theme={theme}
          className="font-normal"
        />
      </h2>
    </div>
  );
}
