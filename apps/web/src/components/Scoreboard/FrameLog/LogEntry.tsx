import { Accordion } from "@heroui/react";

import type { CompositionFilterCounts } from "@/components/Scoreboard/summaryBreakCompositionFilters";
import {
  getPlayerThemeClassName,
  type PlayerTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import type { FrameLogEntry, Player } from "@/types";
import LogEntryHeader from "./LogEntryHeader";
import LogEntryPanel from "./LogEntryPanel";
import {
  isSyntheticEntry,
  isUnresolvedSummaryBreakEntry,
} from "./logEntryState";

type LogEntryProps = {
  entry: FrameLogEntry;
  canUndo: boolean;
  onUndo: () => void;
  onResolveBreakComposition?: (entryId: string, suggestionId: string) => void;
  compositionFilterCounts?: CompositionFilterCounts;
  players?: Player[];
  playerTheme?: PlayerTheme;
  isExpanded?: boolean;
  isResolutionFocusMode?: boolean;
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
  isResolutionFocusMode = false,
  onExpandedChange = () => {},
}: LogEntryProps) {
  const isCurrentBreak = entry.result === "in_progress";
  const hasShotHistory = !isSyntheticEntry(entry);
  const hasUnresolvedSummaryBreak = isUnresolvedSummaryBreakEntry(entry);
  const canUseUndo = canUndo && !isResolutionFocusMode;

  return (
    <li
      className={`flex w-full flex-col gap-1 py-1 ${
        isResolutionFocusMode ? "min-h-full justify-center" : ""
      }`}
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
        } ${isResolutionFocusMode ? "min-h-0" : ""}`}
      >
        <Accordion.Item id={entry.id}>
          <LogEntryHeader
            entry={entry}
            players={players}
            playerTheme={playerTheme}
            isExpanded={isExpanded}
            canUndo={canUseUndo}
            onUndo={onUndo}
          />

          {isExpanded && hasShotHistory ? (
            <LogEntryPanel
              entry={entry}
              compositionFilterCounts={compositionFilterCounts}
              isExpanded={isExpanded}
              isResolutionFocusMode={isResolutionFocusMode}
              onResolveBreakComposition={onResolveBreakComposition}
              players={players}
            />
          ) : null}
        </Accordion.Item>
      </Accordion>
    </li>
  );
}
