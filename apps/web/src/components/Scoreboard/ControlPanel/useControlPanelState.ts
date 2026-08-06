import { useControlPanel } from "@/hooks/useControlPanel";
import { useGameActions } from "@/hooks/useGameActions";
import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { useMatchroomActions } from "@/hooks/useSocket";
import { getPlayerAvatarTheme } from "../shared/playerIdentity";
import type { FrameLogEntry, GameStateMessage, Player } from "@/types";

type ScorekeepingTarget = {
  player: Player;
  theme: ReturnType<typeof getPlayerAvatarTheme>;
};

function getScorekeepingTargetPlayer({
  currentTurn,
  players,
  scoreKeeper,
}: {
  currentTurn: string;
  players: Player[];
  scoreKeeper: GameStateMessage["score_keeper"];
}): Player | undefined {
  if (scoreKeeper === "self" || scoreKeeper === "opp") {
    return players.find((player) => player.session_key === currentTurn);
  }

  return undefined;
}

function getScorekeepingTarget({
  currentTurn,
  players,
  scoreKeeper,
}: {
  currentTurn: string;
  players: Player[];
  scoreKeeper: GameStateMessage["score_keeper"];
}): ScorekeepingTarget | undefined {
  const player = getScorekeepingTargetPlayer({
    currentTurn,
    players,
    scoreKeeper,
  });

  if (!player) {
    return undefined;
  }

  return {
    player,
    theme: getPlayerAvatarTheme(player.session_key, players),
  };
}

function currentVisitHasDetailedLogging(
  frameLog: FrameLogEntry[],
  currentTurn: string,
) {
  const latestVisit = frameLog.at(-1);
  if (!latestVisit || latestVisit.player_key !== currentTurn) {
    return false;
  }

  return latestVisit.result === "in_progress" && latestVisit.shot_count > 0;
}

export function useControlPanelState() {
  const { currentPlayerKey, players = [] } = useMatchroomPlayers();
  const {
    hasFrame,
    frame,
    frameLog = [],
    frameSummary,
    scoreKeeper,
    nextFrameConfirmations,
  } = useMatchroomFrame();
  const { sendAction } = useMatchroomActions();
  const actions = useGameActions(sendAction);

  const panelState = useControlPanel(
    frame,
    scoreKeeper,
    currentPlayerKey,
    nextFrameConfirmations,
  );

  const canUseFoulOptions =
    panelState.canKeepScore &&
    frame.status === "active" &&
    Boolean(frame.previously_fouled) &&
    !panelState.freeBall;
  const scorekeepingTarget = getScorekeepingTarget({
    currentTurn: frame.current_turn,
    players,
    scoreKeeper,
  });
  const canLogSummaryBreak =
    panelState.canKeepScore &&
    !currentVisitHasDetailedLogging(frameLog, frame.current_turn);

  return {
    ...panelState,
    ...actions,
    hasFrame,
    frame,
    frameSummary,
    scoreKeeper,
    currentPlayerKey,
    players,
    scorekeepingTarget,
    canUseFoulOptions,
    canLogSummaryBreak,
  };
}
