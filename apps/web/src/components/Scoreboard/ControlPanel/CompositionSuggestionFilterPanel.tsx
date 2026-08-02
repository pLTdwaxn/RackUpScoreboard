"use client";

import { Button, Surface } from "@heroui/react";
import { IconX } from "@tabler/icons-react";

import { BallName } from "@/domain/balls";
import type { AppDictionary } from "@/i18n";
import { useAppDictionary } from "@/i18n/client";
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
  onCancel: () => void;
};

export default function CompositionSuggestionFilterPanel({
  counts,
  suggestions,
  onBallTap,
  onCancel,
}: CompositionSuggestionFilterPanelProps) {
  const copy = useAppDictionary().controlPanel.compositionFilter;
  const description = compositionFilterDescription(counts, copy);

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
                copy={copy}
                onPress={() => onBallTap(ball)}
              />
            ))}
          </div>
        }
        actionsRow={
          <div className="flex w-full justify-end">
            <Button
              aria-label={copy.cancel}
              size="sm"
              isIconOnly
              variant="secondary"
              onPress={onCancel}
            >
              <IconX stroke={2} />
            </Button>
          </div>
        }
      />
    </Surface>
  );
}

function compositionFilterDescription(
  counts: CompositionFilterCounts,
  copy: AppDictionary["controlPanel"]["compositionFilter"],
): string {
  const activeCounts = ALL_BALLS.flatMap((ball) => {
    const count = counts[ball] ?? 0;
    return count ? [`${count} ${ball}${count === 1 ? "" : "s"}`] : [];
  });

  if (!activeCounts.length) {
    return copy.empty;
  }

  return copy.showingAtLeast(
    joinDescriptionParts(activeCounts, copy.conjunction),
  );
}

function joinDescriptionParts(
  parts: string[],
  copy: AppDictionary["controlPanel"]["compositionFilter"]["conjunction"],
): string {
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} ${copy.two} ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(", ")}, ${copy.final} ${parts.at(-1)}`;
}

function CompositionFilterBall({
  ball,
  count,
  copy,
  maxCount,
  onPress,
}: {
  ball: BallName;
  count: number;
  copy: AppDictionary["controlPanel"]["compositionFilter"];
  maxCount: number;
  onPress: () => void;
}) {
  return (
    <Button
      aria-label={copy.ariaLabel(ball, count)}
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
