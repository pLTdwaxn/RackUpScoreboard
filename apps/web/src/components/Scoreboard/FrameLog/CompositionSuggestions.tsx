import { ListBox, ScrollShadow } from "@heroui/react";
import { useMemo } from "react";

import {
  CompositionFilterCounts,
  filterCompositionSuggestions,
  unresolvedSummaryBreakShot,
} from "@/components/Scoreboard/summaryBreakCompositionFilters";
import type {
  FrameLogEntry,
  SummaryBreakCompositionSuggestion,
} from "@/types";
import BallComposition from "./BallComposition";

type CompositionSuggestionsProps = {
  entry: FrameLogEntry;
  onResolveBreakComposition?: (entryId: string, suggestionId: string) => void;
  compositionFilterCounts?: CompositionFilterCounts;
};

export default function CompositionSuggestions({
  entry,
  onResolveBreakComposition,
  compositionFilterCounts = {},
}: CompositionSuggestionsProps) {
  const summaryBreakShot = useMemo(() => unresolvedSummaryBreakShot(entry), [entry]);
  const suggestions: SummaryBreakCompositionSuggestion[] = useMemo(
    () => summaryBreakShot?.composition_suggestions ?? [],
    [summaryBreakShot],
  );
  const filteredSuggestions = useMemo(
    () => filterCompositionSuggestions(suggestions, compositionFilterCounts),
    [compositionFilterCounts, suggestions],
  );

  if (!summaryBreakShot || !suggestions.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <ScrollShadow
        hideScrollBar
        orientation="vertical"
        size={16}
        className="max-h-[15.25rem] overflow-y-auto pr-1"
      >
        <ListBox
          aria-label="Summary break composition suggestions"
          selectionMode="single"
          onAction={(key) =>
            onResolveBreakComposition?.(summaryBreakShot.history_id, String(key))
          }
        >
          {filteredSuggestions.map((suggestion, index) => (
            <ListBox.Item
              key={suggestion.id}
              id={suggestion.id}
              aria-label={suggestion.label}
              textValue={suggestion.label}
              className={`min-h-11 rounded-lg px-0 py-0 ${
                index > 0 ? "border-t border-warning/30" : ""
              }`}
            >
              <div className="flex min-w-0 px-2 py-2">
                <BallComposition
                  entryId={`${entry.id}-${suggestion.id}`}
                  pottedBalls={suggestion.balls}
                  tokenSize="sm"
                />
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </ScrollShadow>
    </div>
  );
}
