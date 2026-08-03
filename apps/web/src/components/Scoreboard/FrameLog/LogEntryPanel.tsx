import { Accordion } from "@heroui/react";

import type { CompositionFilterCounts } from "@/components/Scoreboard/summaryBreakCompositionFilters";
import type { FrameLogEntry, Player } from "@/types";
import CompositionSuggestions from "./CompositionSuggestions";
import ResolutionFocusMessage from "./ResolutionFocusMessage";
import ShotHistory from "./ShotHistory";

type LogEntryPanelProps = {
  entry: FrameLogEntry;
  compositionFilterCounts?: CompositionFilterCounts;
  isExpanded: boolean;
  isResolutionFocusMode: boolean;
  onResolveBreakComposition?: (entryId: string, suggestionId: string) => void;
  players: Player[];
};

export default function LogEntryPanel({
  entry,
  compositionFilterCounts,
  isExpanded,
  isResolutionFocusMode,
  onResolveBreakComposition,
  players,
}: LogEntryPanelProps) {
  return (
    <Accordion.Panel
      className={`flex flex-col gap-3 rounded-lg bg-default-100/60 p-4 text-muted ${
        isResolutionFocusMode ? "min-h-72" : ""
      }`}
    >
      {isResolutionFocusMode ? <ResolutionFocusMessage /> : null}
      <CompositionSuggestions
        entry={entry}
        onResolveBreakComposition={onResolveBreakComposition}
        compositionFilterCounts={compositionFilterCounts}
      />
      <ShotHistory entry={entry} isExpanded={isExpanded} players={players} />
    </Accordion.Panel>
  );
}
