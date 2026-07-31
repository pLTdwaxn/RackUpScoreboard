import { ScrollShadow } from "@heroui/react";
import { useMemo, useRef } from "react";

import type { FrameLogEntry } from "@/types";
import BallComposition from "./BallComposition";
import useScrollToEnd from "./useScrollToEnd";

type BallCompositionScrollerProps = {
  entry: FrameLogEntry;
};

export default function BallCompositionScroller({
  entry,
}: BallCompositionScrollerProps) {
  const ballScrollRef = useRef<HTMLDivElement>(null);
  const ballCompositionKey = useMemo(
    () =>
      [
        entry.potted_balls.join(","),
        entry.free_ball_pots
          .map((pot) => `${pot.potted_ball}:${pot.counts_as}`)
          .join(","),
      ].join("|"),
    [entry.free_ball_pots, entry.potted_balls],
  );

  useScrollToEnd({
    axis: "horizontal",
    scrollRef: ballScrollRef,
    updateKey: ballCompositionKey,
  });

  return (
    <ScrollShadow
      ref={ballScrollRef}
      hideScrollBar
      orientation="horizontal"
      size={24}
      className="w-full max-w-full min-w-0"
    >
      <BallComposition
        entryId={entry.id}
        pottedBalls={entry.potted_balls}
        freeBallPots={entry.free_ball_pots}
        tokenSize="sm"
      />
    </ScrollShadow>
  );
}
