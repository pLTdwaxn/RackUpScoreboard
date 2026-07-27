import { Accordion, Button, ScrollShadow } from "@heroui/react";
import { IconArrowBackUp, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import { FrameLogEntry, FrameLogFact, FreeBallPot, Player } from "@/types";
import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import { PlayerNameText } from "@/components/Scoreboard/shared/PlayerName";
import {
  getPlayerAvatarTheme,
  getPlayerInitials,
  getPlayerThemeClassName,
  PlayerTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import BallComposition from "./BallComposition";

type LogEntryProps = {
  entry: FrameLogEntry;
  canUndo: boolean;
  onUndo: () => void;
  players?: Player[];
  playerTheme?: PlayerTheme;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
};

type BallCompositionScrollerProps = {
  entry: FrameLogEntry;
};

type ShotHistoryProps = {
  entry: FrameLogEntry;
  isExpanded: boolean;
  players: Player[];
};

type ScrollAxis = "horizontal" | "vertical";

export default function LogEntry({
  entry,
  canUndo,
  onUndo,
  players = [],
  playerTheme = "neutral",
  isExpanded = false,
  onExpandedChange = () => {},
}: LogEntryProps) {
  const initials = getPlayerInitials(entry.player_name);
  const isCurrentBreak = entry.result === "in_progress";

  return (
    <li className="flex w-full flex-col gap-1 py-1">
      <Accordion
        variant="surface"
        allowsMultipleExpanded={false}
        expandedKeys={isExpanded ? [entry.id] : []}
        onExpandedChange={(keys) => onExpandedChange(keys.has(entry.id))}
        className={`${getPlayerThemeClassName(playerTheme)} w-full p-0 ${
          isCurrentBreak ? "current-break-glow" : ""
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

          {isExpanded ? (
            <Accordion.Panel className="rounded-lg bg-default-100/60 p-4 text-muted">
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

function FrameLogFactMessage({
  facts,
  fallbackPlayerName,
  players,
}: {
  facts: FrameLogFact[];
  fallbackPlayerName: string;
  players: Player[];
}) {
  const primaryFact = facts?.[0];
  if (!primaryFact) {
    return null;
  }

  return (
    <span aria-label={labelForFact(primaryFact, fallbackPlayerName, players)}>
      <FactContent
        fact={primaryFact}
        fallbackPlayerName={fallbackPlayerName}
        players={players}
      />
    </span>
  );
}

function FactContent({
  fact,
  fallbackPlayerName,
  players,
}: {
  fact: FrameLogFact;
  fallbackPlayerName: string;
  players: Player[];
}) {
  switch (fact.kind) {
    case "visit_summary":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {visitSummarySuffix(fact)}
        </>
      );
    case "shot_result":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {shotResultSuffix(fact)}
        </>
      );
    case "free_ball_nomination":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {` nominated the ${fact.nominated_colour} free ball.`}
        </>
      );
    case "pass_shot":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {" passed the shot back."}
        </>
      );
    case "reset_shot":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {" reset the shot."}
        </>
      );
  }
}

function ThemedFactPlayer({
  playerKey,
  fallbackPlayerName,
  players,
}: {
  playerKey: string;
  fallbackPlayerName: string;
  players: Player[];
}) {
  const player = players.find((item) => item.session_key === playerKey);
  return (
    <PlayerNameText
      name={player?.name ?? fallbackPlayerName}
      theme={getPlayerAvatarTheme(playerKey, players)}
    />
  );
}

function labelForFact(
  fact: FrameLogFact,
  fallbackPlayerName: string,
  players: Player[],
): string {
  const playerName =
    players.find((player) => player.session_key === fact.player_key)?.name ??
    fallbackPlayerName;

  switch (fact.kind) {
    case "visit_summary":
      return `${playerName}${visitSummarySuffix(fact)}`;
    case "shot_result":
      return `${playerName}${shotResultSuffix(fact)}`;
    case "free_ball_nomination":
      return `${playerName} nominated the ${fact.nominated_colour} free ball.`;
    case "pass_shot":
      return `${playerName} passed the shot back.`;
    case "reset_shot":
      return `${playerName} reset the shot.`;
  }
}

function visitSummarySuffix(fact: Extract<FrameLogFact, { kind: "visit_summary" }>): string {
  if (fact.result === "frame_won") {
    return ": won the frame";
  }
  if (fact.foul_points && fact.break_points) {
    return `: break ${fact.break_points}, foul ${fact.foul_points}`;
  }
  if (fact.foul_points) {
    return `: foul ${fact.foul_points}`;
  }
  if (fact.break_points) {
    return `: break ${fact.break_points}`;
  }
  return ": no score";
}

function shotResultSuffix(fact: Extract<FrameLogFact, { kind: "shot_result" }>): string {
  if (fact.foul_points) {
    return ` fouled for ${fact.foul_points}.`;
  }
  if (!fact.potted_balls.length) {
    return " did not score.";
  }

  return ` potted ${pottedBallsPhrase(fact.potted_balls, fact.free_ball_pots)}.`;
}

function pottedBallsPhrase(
  pottedBalls: string[],
  freeBallPots: FreeBallPot[],
): string {
  const remainingFreeBallPots = [...freeBallPots];
  const phrases = pottedBalls.map((ball) => {
    const freeBallPotIndex = remainingFreeBallPots.findIndex(
      (pot) => pot.potted_ball === ball,
    );
    if (freeBallPotIndex < 0) {
      return ballPhrase(ball);
    }

    const [freeBallPot] = remainingFreeBallPots.splice(freeBallPotIndex, 1);
    return `${ballPhrase(ball)} as ${ballPhrase(freeBallPot.counts_as)}`;
  });

  return joinPhrases(phrases);
}

function ballPhrase(ball: string): string {
  return ball === "red" ? "a red" : `the ${ball}`;
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) {
    return phrases[0] ?? "nothing";
  }
  if (phrases.length === 2) {
    return `${phrases[0]} and ${phrases[1]}`;
  }
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases.at(-1)}`;
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

function ShotHistory({ entry, isExpanded, players }: ShotHistoryProps) {
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
              <FrameLogFactMessage
                facts={shot.facts}
                fallbackPlayerName={entry.player_name}
                players={players}
              />
            </li>
          );
        })}
      </ol>
    </ScrollShadow>
  );
}
