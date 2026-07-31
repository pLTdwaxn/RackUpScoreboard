import { Accordion, Button } from "@heroui/react";
import { IconArrowBackUp, IconChevronDown } from "@tabler/icons-react";

import type { CompositionFilterCounts } from "@/components/Scoreboard/summaryBreakCompositionFilters";
import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import {
  getPlayerInitials,
  getPlayerThemeClassName,
  type PlayerTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import type { FrameLogEntry, Player } from "@/types";
import BallCompositionScroller from "./BallCompositionScroller";
import CompositionSuggestions from "./CompositionSuggestions";
import FrameLogFactMessage from "./FrameLogFactMessage";
import ShotHistory from "./ShotHistory";

type LogEntryProps = {
  entry: FrameLogEntry;
  canUndo: boolean;
  onUndo: () => void;
  onResolveBreakComposition?: (entryId: string, suggestionId: string) => void;
  compositionFilterCounts?: CompositionFilterCounts;
  players?: Player[];
  playerTheme?: PlayerTheme;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
};

export default function LogEntry({
  entry,
  canUndo,
  onUndo,
  onResolveBreakComposition,
  compositionFilterCounts,
  players = [],
  playerTheme = "neutral",
  isExpanded = false,
  onExpandedChange = () => {},
}: LogEntryProps) {
  const initials = getPlayerInitials(entry.player_name);
  const isCurrentBreak = entry.result === "in_progress";
  const hasShotHistory = !isSyntheticEntry(entry);
  const hasUnresolvedSummaryBreak = isUnresolvedSummaryBreakEntry(entry);

  return (
    <li
      className="flex w-full flex-col gap-1 py-1"
      data-unresolved-summary-break={hasUnresolvedSummaryBreak || undefined}
    >
      <Accordion
        variant="surface"
        allowsMultipleExpanded={false}
        expandedKeys={isExpanded ? [entry.id] : []}
        onExpandedChange={(keys) => onExpandedChange(keys.has(entry.id))}
        className={`${getPlayerThemeClassName(playerTheme)} w-full border-2 p-0 ${
          isCurrentBreak ? "current-break-glow" : ""
        } ${
          hasUnresolvedSummaryBreak
            ? "border-warning/80 shadow-sm shadow-warning/20"
            : "border-transparent"
        }`}
      >
        <Accordion.Item id={entry.id}>
          <Accordion.Heading className="relative w-full">
            <Accordion.Trigger
              aria-label={
                isExpanded
                  ? "Collapse frame log entry details"
                  : "Expand frame log entry details"
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

            <Button
              size="sm"
              aria-label="Undo latest frame log action"
              isIconOnly
              isDisabled={!canUndo}
              variant={canUndo ? "primary" : "ghost"}
              onPress={onUndo}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                canUndo
                  ? "bg-warning/80 hover:bg-warning/70 focus:bg-warning/70 active:bg-warning/60"
                  : ""
              }`}
            >
              <IconArrowBackUp stroke={2} />
            </Button>
          </Accordion.Heading>

          {isExpanded && hasShotHistory ? (
            <Accordion.Panel className="flex flex-col gap-3 rounded-lg bg-default-100/60 p-4 text-muted">
              <CompositionSuggestions
                entry={entry}
                onResolveBreakComposition={onResolveBreakComposition}
                compositionFilterCounts={compositionFilterCounts}
              />
              <ShotHistory
                entry={entry}
                isExpanded={isExpanded}
                players={players}
              />
            </Accordion.Panel>
          ) : null}
        </Accordion.Item>
      </Accordion>
    </li>
  );
}

function isUnresolvedSummaryBreakEntry(entry: FrameLogEntry): boolean {
  return Boolean(
    entry.shots?.some(
      (shot) =>
        shot.action === "log_break" && shot.composition_status === "missing",
    ) ||
      entry.facts.some(
        (fact) =>
          fact.kind === "summary_break" &&
          fact.composition_status === "missing",
      ),
  );
}

function isSyntheticEntry(entry: FrameLogEntry): boolean {
  const factKind = entry.facts[0]?.kind;
  return factKind === "break_off" || factKind === "turn_started";
}
