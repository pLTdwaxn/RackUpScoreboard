import { Accordion, Button, ScrollShadow } from "@heroui/react";
import { IconArrowBackUp, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { FrameLogEntry } from "@/types";
import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import {
  getCurrentBreakGlowStyle,
  getAvatarColors,
  getPlayerInitials,
  PlayerAvatarTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import BallComposition from "./BallComposition";

type LogEntryProps = {
  entry: FrameLogEntry;
  canUndo: boolean;
  onUndo: () => void;
  playerTheme?: PlayerAvatarTheme;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
};

type BallCompositionScrollerProps = {
  entry: FrameLogEntry;
};

type ShotHistoryProps = {
  entry: FrameLogEntry;
  isExpanded: boolean;
};

type ScrollAxis = "horizontal" | "vertical";

export default function LogEntry({
  entry,
  canUndo,
  onUndo,
  playerTheme = "neutral",
  isExpanded = false,
  onExpandedChange = () => {},
}: LogEntryProps) {
  const { avatarColor, avatarColor2, avatarBackground } =
    getAvatarColors(playerTheme);
  const initials = getPlayerInitials(entry.player_name);
  const isCurrentBreak = entry.result === "in_progress";

  return (
    <li className="flex w-full flex-col gap-1 py-1">
      <Accordion
        variant="surface"
        allowsMultipleExpanded={false}
        expandedKeys={isExpanded ? [entry.id] : []}
        onExpandedChange={(keys) => onExpandedChange(keys.has(entry.id))}
        className={`w-full p-0 ${isCurrentBreak ? "current-break-glow" : ""}`}
        style={isCurrentBreak ? getCurrentBreakGlowStyle(playerTheme) : undefined}
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
                avatarColor={avatarColor}
                avatarColor2={avatarColor2}
                avatarBackground={avatarBackground}
                initials={initials}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="block min-w-0 truncate text-sm text-muted">
                  <BackendLogMessage message={entry.message} />
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

          {isExpanded ? (
            <Accordion.Panel className="rounded-lg bg-default-100/60 p-4 text-muted">
              <ShotHistory entry={entry} isExpanded={isExpanded} />
            </Accordion.Panel>
          ) : null}
        </Accordion.Item>
      </Accordion>
    </li>
  );
}

function BackendLogMessage({ message }: { message: string }) {
  // Backend log messages contain embedded player names; they need structured parts before names can be themed here.
  return <>{message}</>;
}

function useScrollToEnd<T extends HTMLElement>({
  axis,
  enabled = true,
  scrollRef,
  updateKey,
}: {
  axis: ScrollAxis;
  enabled?: boolean;
  scrollRef: RefObject<T | null>;
  updateKey: string;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      if (axis === "horizontal") {
        scrollElement.scrollTo({
          left: scrollElement.scrollWidth,
          behavior: "smooth",
        });
        return;
      }

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [axis, enabled, scrollRef, updateKey]);
}

function BallCompositionScroller({ entry }: BallCompositionScrollerProps) {
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

function ShotHistory({ entry, isExpanded }: ShotHistoryProps) {
  const shotHistoryScrollRef = useRef<HTMLDivElement>(null);
  const shots = entry.shots ?? [];
  const shotHistoryKey = [
    entry.shots?.map((shot) => shot.history_id).join(",") ?? "",
    entry.shot_count,
  ].join(":");

  useScrollToEnd({
    axis: "vertical",
    enabled: isExpanded,
    scrollRef: shotHistoryScrollRef,
    updateKey: shotHistoryKey,
  });

  if (!shots.length) {
    return (
      <div>
        {entry.shot_count} {entry.shot_count === 1 ? "shot" : "shots"}
      </div>
    );
  }

  return (
    <ScrollShadow
      ref={shotHistoryScrollRef}
      hideScrollBar
      orientation="vertical"
      size={16}
      className="max-h-24 overflow-y-auto pr-1"
    >
      <ol className="flex flex-col gap-1">
        {shots.map((shot, index) => {
          const isLastShot = index === shots.length - 1;

          return (
            <li
              key={shot.history_id}
              aria-current={isLastShot ? "true" : undefined}
              className={isLastShot ? "font-medium text-foreground" : ""}
            >
              <BackendLogMessage message={shot.message} />
            </li>
          );
        })}
      </ol>
    </ScrollShadow>
  );
}
