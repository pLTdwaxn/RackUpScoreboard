import { ScrollShadow } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useGameActions } from "@/hooks/useGameActions";
import {
  useMatchroomActions,
  useMatchroomGame,
} from "@/hooks/useSocket";
import { FrameLogEntry } from "@/types";
import LogEntry from "./LogEntry";

type ExpandedEntryOverride = {
  id: string | null;
  updateKey: string;
};

function getFrameLogEntryUpdateKey(entry?: FrameLogEntry): string {
  if (!entry) {
    return "";
  }

  const latestHistoryId = entry.history_ids.at(-1) ?? "";
  const latestShotId = entry.shots?.at(-1)?.history_id ?? "";

  return [
    entry.id,
    latestHistoryId,
    latestShotId,
    entry.shot_count,
  ].join(":");
}

function useAutoExpandedFrameLogEntry(
  latestEntryId: string | undefined,
  latestEntryUpdateKey: string,
) {
  const [expandedEntryOverride, setExpandedEntryOverride] =
    useState<ExpandedEntryOverride>({ id: null, updateKey: "" });

  const expandedEntryId =
    expandedEntryOverride.updateKey === latestEntryUpdateKey
      ? expandedEntryOverride.id
      : (latestEntryId ?? null);

  const handleExpandedChange = (entryId: string, isExpanded: boolean) => {
    setExpandedEntryOverride({
      id: isExpanded ? entryId : null,
      updateKey: latestEntryUpdateKey,
    });
  };

  return { expandedEntryId, handleExpandedChange };
}

function useScrollLatestLogEntryIntoView(
  listRef: React.RefObject<HTMLOListElement | null>,
  latestEntryUpdateKey: string,
) {
  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const latestLogElement = listRef.current?.lastElementChild;
      if (!latestLogElement || !("scrollIntoView" in latestLogElement)) {
        return;
      }

      latestLogElement.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [latestEntryUpdateKey, listRef]);
}

export default function FrameLog() {
  const listRef = useRef<HTMLOListElement>(null);
  const { gameState } = useMatchroomGame();
  const { sendAction } = useMatchroomActions();
  const { sendUndo } = useGameActions(sendAction);
  const frameLog = gameState?.frame_log ?? [];
  const latestEntry = frameLog.at(-1);
  const latestEntryId = latestEntry?.id;
  const latestEntryUpdateKey = useMemo(
    () => getFrameLogEntryUpdateKey(latestEntry),
    [latestEntry],
  );
  const canUndo = Boolean(
    latestEntryId && gameState?.current_frame.status !== "finished",
  );
  const { expandedEntryId, handleExpandedChange } =
    useAutoExpandedFrameLogEntry(latestEntryId, latestEntryUpdateKey);

  useScrollLatestLogEntryIntoView(listRef, latestEntryUpdateKey);

  return (
    <ScrollShadow
      hideScrollBar
      className="h-full min-h-0 overflow-y-auto p-1 text-muted"
    >
      <ol ref={listRef} className="flex flex-col text-sm">
        {frameLog.map((entry) => (
          <LogEntry
            key={entry.id}
            entry={entry}
            canUndo={entry.id === latestEntryId && canUndo}
            onUndo={sendUndo}
            isExpanded={entry.id === expandedEntryId}
            onExpandedChange={(isExpanded) =>
              handleExpandedChange(entry.id, isExpanded)
            }
          />
        ))}
      </ol>
    </ScrollShadow>
  );
}
