"use client";

import { Button, Surface } from "@heroui/react";
import { IconFilterOff } from "@tabler/icons-react";

import { BallName } from "@/domain/balls";
import ControlPanelLayout from "./ControlPanelLayout";
import {
  CompositionFilterCounts,
  maxBallCount,
} from "../summaryBreakCompositionFilters";
import type { SummaryBreakCompositionSuggestion } from "@/types";
import { ALL_BALLS, BALL_CLASS, BALL_SURFACE_CLASS } from "./shared/ballRail";

type CompositionSuggestionFilterPanelProps = {
  counts: CompositionFilterCounts;
  suggestions: SummaryBreakCompositionSuggestion[];
  onBallTap: (ball: BallName) => void;
  onReset: () => void;
};

export default function CompositionSuggestionFilterPanel({
  counts,
  suggestions,
  onBallTap,
  onReset,
}: CompositionSuggestionFilterPanelProps) {
  const hasFilters = Object.values(counts).some((count) => count);
  const description = compositionFilterDescription(counts);

  return (
    <Surface
      variant="default"
      className="mt-auto w-full items-center rounded-3xl p-3 text-center"
    >
      <ControlPanelLayout
        messageRow={
          <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
            <span className="text-center">{description}</span>
          </div>
        }
        ballRow={
          <div className="flex w-full flex-row items-stretch justify-between gap-1">
            {ALL_BALLS.map((ball) => (
              <CompositionFilterBall
                key={ball}
                ball={ball}
                count={counts[ball] ?? 0}
                maxCount={maxBallCount(suggestions, ball)}
                onPress={() => onBallTap(ball)}
              />
            ))}
          </div>
        }
        actionsRow={
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div />
            <Button
              aria-label="Reset composition filters"
              isIconOnly
              isDisabled={!hasFilters}
              size="sm"
              variant="secondary"
              onPress={onReset}
            >
              <IconFilterOff stroke={2} />
            </Button>
            <div />
          </div>
        }
      />
    </Surface>
  );
}

function compositionFilterDescription(counts: CompositionFilterCounts): string {
  const activeCounts = ALL_BALLS.flatMap((ball) => {
    const count = counts[ball] ?? 0;
    return count ? [`${count} ${ball}${count === 1 ? "" : "s"}`] : [];
  });

  if (!activeCounts.length) {
    return "Tap balls to narrow the break composition";
  }

  return `Showing breaks with at least ${joinDescriptionParts(activeCounts)}`;
}

function joinDescriptionParts(parts: string[]): string {
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function CompositionFilterBall({
  ball,
  count,
  maxCount,
  onPress,
}: {
  ball: BallName;
  count: number;
  maxCount: number;
  onPress: () => void;
}) {
  return (
    <Button
      aria-label={`${ball} suggestion filter${count ? ` ${count}` : ""}`}
      isIconOnly
      isDisabled={maxCount === 0}
      onPress={onPress}
      size="lg"
      type="button"
      className={`${BALL_SURFACE_CLASS} ${BALL_CLASS[ball]}`}
    >
      <span className="relative z-10">{count > 0 ? count : null}</span>
    </Button>
  );
}
