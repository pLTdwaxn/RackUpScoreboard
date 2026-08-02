import { Accordion } from "@heroui/react";
import { IconChevronDown } from "@tabler/icons-react";

import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import { useAppDictionary } from "@/i18n/client";
import {
  getPlayerInitials,
  getPlayerThemeClassName,
  type PlayerTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import type { FrameLogEntry, Player } from "@/types";
import BallCompositionScroller from "./BallCompositionScroller";
import FrameLogFactMessage from "./FrameLogFactMessage";
import LogEntryUndoButton from "./LogEntryUndoButton";

type LogEntryHeaderProps = {
  entry: FrameLogEntry;
  players: Player[];
  playerTheme: PlayerTheme;
  isExpanded: boolean;
  canUndo: boolean;
  onUndo: () => void;
};

export default function LogEntryHeader({
  entry,
  players,
  playerTheme,
  isExpanded,
  canUndo,
  onUndo,
}: LogEntryHeaderProps) {
  const copy = useAppDictionary().frameLog;
  const initials = getPlayerInitials(entry.player_name);

  return (
    <Accordion.Heading className="relative w-full">
      <Accordion.Trigger
        aria-label={
          isExpanded
            ? copy.collapseEntryDetails
            : copy.expandEntryDetails
        }
        className="relative flex w-full min-w-0 items-center gap-3 rounded-3xl p-2 pr-24 text-left text-foreground"
      >
        <PlayerAvatar
          className={getPlayerThemeClassName(playerTheme)}
          initials={initials}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="block min-w-0 truncate text-sm text-muted">
            <FrameLogFactMessage
              facts={entry.facts}
              fallbackPlayerName={entry.player_name}
              players={players}
            />
          </span>

          <BallCompositionScroller entry={entry} />
        </div>

        <span className="absolute right-12 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Accordion.Indicator>
            <IconChevronDown stroke={2} />
          </Accordion.Indicator>
        </span>
      </Accordion.Trigger>

      <LogEntryUndoButton canUndo={canUndo} onUndo={onUndo} />
    </Accordion.Heading>
  );
}
