import { ScrollShadow } from "@heroui/react";

import { useGameActions } from "@/hooks/useGameActions";
import {
  useMatchroomActions,
  useMatchroomGame,
  useMatchroomSession,
} from "@/hooks/useSocket";
import LogEntry from "./LogEntry";

export default function FrameLog() {
  const { gameState } = useMatchroomGame();
  const { sessionKey } = useMatchroomSession();
  const { sendAction } = useMatchroomActions();
  const { sendUndo } = useGameActions(sendAction);
  const frameLog = gameState?.frame_log ?? [];
  const latestEntryId = frameLog.at(-1)?.id;
  const canUndo = Boolean(
    latestEntryId && gameState?.current_frame.status !== "finished",
  );

  return (
    <ScrollShadow
      hideScrollBar
      className="h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y text-muted"
    >
      <ol className="flex flex-col text-sm">
        {frameLog.map((entry) => (
          <LogEntry
            key={entry.id}
            entry={entry}
            isCurrentUser={entry.player_key === sessionKey}
            canUndo={entry.id === latestEntryId && canUndo}
            onUndo={sendUndo}
          />
        ))}
      </ol>
    </ScrollShadow>
  );
}
