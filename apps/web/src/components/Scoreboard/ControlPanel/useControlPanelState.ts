import { useControlPanel } from "@/hooks/useControlPanel";
import { useGameActions } from "@/hooks/useGameActions";
import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { useMatchroomActions } from "@/hooks/useSocket";

export function useControlPanelState() {
  const { currentPlayerKey } = useMatchroomPlayers();
  const { hasFrame, frame, scoreKeeper, nextFrameConfirmations } =
    useMatchroomFrame();
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

  return {
    ...panelState,
    ...actions,
    hasFrame,
    frame,
    scoreKeeper,
    currentPlayerKey,
    canUseFoulOptions,
  };
}
