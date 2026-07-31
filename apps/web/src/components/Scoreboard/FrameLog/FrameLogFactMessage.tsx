import type { ReactNode } from "react";

import { PlayerNameText } from "@/components/Scoreboard/shared/PlayerName";
import {
  getPlayerAvatarTheme,
} from "@/components/Scoreboard/shared/playerIdentity";
import { getSnookerBallNameTextClass } from "@/components/Scoreboard/shared/snookerBallStyles";
import { getFrameLogDictionary } from "@/i18n";
import type { FrameLogFact, FreeBallPot, Player } from "@/types";

const frameLogDictionary = getFrameLogDictionary();

export default function FrameLogFactMessage({
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
          <ShotResultContent fact={fact} />
        </>
      );
    case "summary_break":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {summaryBreakSuffix(fact)}
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
          {frameLogDictionary.freeBallNomination.prefix}
          <BallNameText ball={fact.nominated_colour} />
          {frameLogDictionary.freeBallNomination.suffix}
        </>
      );
    case "break_off":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {frameLogDictionary.breakOff.suffix}
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
          {frameLogDictionary.passShot.suffix}
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
          {frameLogDictionary.resetShot.suffix}
        </>
      );
    case "turn_started":
      return (
        <>
          <ThemedFactPlayer
            playerKey={fact.player_key}
            fallbackPlayerName={fallbackPlayerName}
            players={players}
          />
          {frameLogDictionary.turnStarted.suffix}
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
    case "summary_break":
      return `${playerName}${summaryBreakSuffix(fact)}`;
    case "free_ball_nomination":
      return `${playerName}${frameLogDictionary.freeBallNomination.label({
        ball: fact.nominated_colour,
      })}`;
    case "break_off":
      return `${playerName}${frameLogDictionary.breakOff.suffix}`;
    case "pass_shot":
      return `${playerName}${frameLogDictionary.passShot.suffix}`;
    case "reset_shot":
      return `${playerName}${frameLogDictionary.resetShot.suffix}`;
    case "turn_started":
      return `${playerName}${frameLogDictionary.turnStarted.suffix}`;
  }
}

function summaryBreakSuffix(
  fact: Extract<FrameLogFact, { kind: "summary_break" }>,
): string {
  if (fact.foul_points && fact.break_points) {
    return ` logged break ${fact.break_points}, foul ${fact.foul_points}.`;
  }
  if (fact.foul_points) {
    return ` logged foul ${fact.foul_points}.`;
  }
  return ` logged break ${fact.break_points}.`;
}

function visitSummarySuffix(
  fact: Extract<FrameLogFact, { kind: "visit_summary" }>,
): string {
  if (fact.result === "frame_won") {
    return frameLogDictionary.visitSummary.frameWon;
  }
  if (fact.foul_points && fact.break_points) {
    return frameLogDictionary.visitSummary.breakAndFoul({
      breakPoints: fact.break_points,
      foulPoints: fact.foul_points,
    });
  }
  if (fact.foul_points) {
    return frameLogDictionary.visitSummary.foulOnly({
      breakPoints: fact.break_points,
      foulPoints: fact.foul_points,
    });
  }
  if (fact.break_points) {
    return frameLogDictionary.visitSummary.breakOnly({
      breakPoints: fact.break_points,
      foulPoints: fact.foul_points,
    });
  }
  return frameLogDictionary.visitSummary.noScore;
}

function shotResultSuffix(
  fact: Extract<FrameLogFact, { kind: "shot_result" }>,
): string {
  if (fact.foul_points) {
    return frameLogDictionary.shotResult.foul({ points: fact.foul_points });
  }
  if (!fact.potted_balls.length) {
    return frameLogDictionary.shotResult.noPot;
  }

  return frameLogDictionary.shotResult.potted({
    pottedBalls: pottedBallsPhrase(
      fact.potted_balls,
      fact.free_ball_pots,
    ),
  });
}

function ShotResultContent({
  fact,
}: {
  fact: Extract<FrameLogFact, { kind: "shot_result" }>;
}) {
  if (fact.foul_points) {
    return <>{frameLogDictionary.shotResult.foul({ points: fact.foul_points })}</>;
  }
  if (!fact.potted_balls.length) {
    return <>{frameLogDictionary.shotResult.noPot}</>;
  }

  return (
    <>
      {frameLogDictionary.shotResult.pottedPrefix}
      <PottedBallsContent
        pottedBalls={fact.potted_balls}
        freeBallPots={fact.free_ball_pots}
      />
      {frameLogDictionary.shotResult.sentenceEnd}
    </>
  );
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
    return `${ballPhrase(ball)} ${frameLogDictionary.ballPhrase.as} ${ballPhrase(freeBallPot.counts_as)}`;
  });

  return joinPhrases(phrases);
}

function ballPhrase(ball: string): string {
  return `${frameLogDictionary.ballPhrase.article(ball)} ${ball}`;
}

function PottedBallsContent({
  pottedBalls,
  freeBallPots,
}: {
  pottedBalls: string[];
  freeBallPots: FreeBallPot[];
}) {
  const remainingFreeBallPots = [...freeBallPots];
  const phrases = pottedBalls.map((ball, index) => {
    const freeBallPotIndex = remainingFreeBallPots.findIndex(
      (pot) => pot.potted_ball === ball,
    );

    if (freeBallPotIndex < 0) {
      return <BallPhraseText key={`${ball}-${index}`} ball={ball} />;
    }

    const [freeBallPot] = remainingFreeBallPots.splice(freeBallPotIndex, 1);
    return (
      <span key={`${ball}-${index}`}>
        <BallPhraseText ball={ball} />
        {` ${frameLogDictionary.ballPhrase.as} `}
        <BallPhraseText ball={freeBallPot.counts_as} />
      </span>
    );
  });

  return <>{joinNodes(phrases)}</>;
}

function BallPhraseText({ ball }: { ball: string }) {
  return (
    <>
      {`${frameLogDictionary.ballPhrase.article(ball)} `}
      <BallNameText ball={ball} />
    </>
  );
}

function BallNameText({ ball }: { ball: string }) {
  return <span className={getSnookerBallNameTextClass(ball)}>{ball}</span>;
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) {
    return phrases[0] ?? "nothing";
  }
  if (phrases.length === 2) {
    return `${phrases[0]} ${frameLogDictionary.conjunction.two} ${phrases[1]}`;
  }
  return `${phrases.slice(0, -1).join(", ")}, ${frameLogDictionary.conjunction.final} ${phrases.at(-1)}`;
}

function joinNodes(nodes: ReactNode[]): ReactNode[] {
  if (nodes.length <= 1) {
    return nodes;
  }
  if (nodes.length === 2) {
    return [nodes[0], ` ${frameLogDictionary.conjunction.two} `, nodes[1]];
  }

  return nodes.flatMap((node, index) => {
    if (index === 0) {
      return [node];
    }
    if (index === nodes.length - 1) {
      return [`, ${frameLogDictionary.conjunction.final} `, node];
    }
    return [", ", node];
  });
}
