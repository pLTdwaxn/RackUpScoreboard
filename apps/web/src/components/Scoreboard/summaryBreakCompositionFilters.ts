import { BALL_NAMES, BallName } from "@/domain/balls";
import type {
  FrameLogEntry,
  FrameLogShot,
  SummaryBreakCompositionSuggestion,
} from "@/types";

export type CompositionFilterCounts = Partial<Record<BallName, number>>;

export type ActiveCompositionFilterEntry = {
  entryId: string;
  historyId: string;
  suggestions: SummaryBreakCompositionSuggestion[];
};

export function unresolvedSummaryBreakShot(
  entry: FrameLogEntry,
): FrameLogShot | undefined {
  return entry.shots?.find(
    (shot) =>
      shot.action === "log_break" &&
      shot.composition_status === "missing" &&
      shot.composition_suggestions?.length,
  );
}

export function activeCompositionFilterEntry(
  entry: FrameLogEntry,
): ActiveCompositionFilterEntry | null {
  const shot = unresolvedSummaryBreakShot(entry);
  if (!shot?.composition_suggestions?.length) {
    return null;
  }

  return {
    entryId: entry.id,
    historyId: shot.history_id,
    suggestions: shot.composition_suggestions,
  };
}

export function filterCompositionSuggestions(
  suggestions: SummaryBreakCompositionSuggestion[],
  counts: CompositionFilterCounts,
): SummaryBreakCompositionSuggestion[] {
  const activeFilters = Object.entries(counts).filter(([, count]) => count);
  if (!activeFilters.length) {
    return suggestions;
  }

  return suggestions.filter((suggestion) => {
    const suggestionCounts = countBalls(suggestion.balls);
    return activeFilters.every(
      ([ball, count]) => (suggestionCounts[ball as BallName] ?? 0) >= count,
    );
  });
}

export function nextCompositionFilterCounts({
  ball,
  counts,
  suggestions,
}: {
  ball: BallName;
  counts: CompositionFilterCounts;
  suggestions: SummaryBreakCompositionSuggestion[];
}): CompositionFilterCounts {
  const maxCount = maxBallCount(suggestions, ball);
  if (maxCount === 0) {
    return counts;
  }

  const currentCount = counts[ball] ?? 0;
  const nextCount = (currentCount + 1) % (maxCount + 1);
  const countDelta = nextCount - currentCount;
  const nextCounts = { ...counts };

  if (nextCount === 0) {
    delete nextCounts[ball];
  } else {
    nextCounts[ball] = nextCount;
  }

  if (ball !== "red") {
    const nextRedCount = Math.max(0, (nextCounts.red ?? 0) + countDelta);
    if (nextRedCount === 0) {
      delete nextCounts.red;
    } else {
      nextCounts.red = nextRedCount;
    }
  }

  return nextCounts;
}

export function maxBallCount(
  suggestions: SummaryBreakCompositionSuggestion[],
  ball: BallName,
): number {
  return Math.max(
    0,
    ...suggestions.map((suggestion) => countBalls(suggestion.balls)[ball] ?? 0),
  );
}

function countBalls(balls: string[]): CompositionFilterCounts {
  return balls.reduce<CompositionFilterCounts>((counts, ball) => {
    if (BALL_NAMES.includes(ball as BallName)) {
      const ballName = ball as BallName;
      counts[ballName] = (counts[ballName] ?? 0) + 1;
    }
    return counts;
  }, {});
}
