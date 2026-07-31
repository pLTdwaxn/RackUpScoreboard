"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@heroui/react";

import { useMatchroomSession } from "@/hooks/useSocket";
import { BallName } from "@/domain/balls";

import { ControlPanel, FrameOverview, FrameLog } from ".";
import CompositionSuggestionFilterPanel from "./ControlPanel/CompositionSuggestionFilterPanel";
import {
  ActiveCompositionFilterEntry,
  CompositionFilterCounts,
  nextCompositionFilterCounts,
} from "./summaryBreakCompositionFilters";

export default function Scoreboard() {
  const { connectionStatus, reconnectAttempt, reconnectDelayMs, socketError } =
    useMatchroomSession();
  const [activeCompositionFilterEntry, setActiveCompositionFilterEntry] =
    useState<ActiveCompositionFilterEntry | null>(null);
  const [compositionFilterCounts, setCompositionFilterCounts] =
    useState<CompositionFilterCounts>({});
  const [suppressedCompositionEntryId, setSuppressedCompositionEntryId] =
    useState<string | null>(null);
  const isCompositionResolutionMode = Boolean(activeCompositionFilterEntry);
  const isReconnecting = connectionStatus === "reconnecting";
  const reconnectDelaySeconds =
    reconnectDelayMs === null ? null : Math.ceil(reconnectDelayMs / 1000);

  useEffect(() => {
    if (!socketError) {
      return;
    }

    toast.danger(socketError, { timeout: 1000 });
  }, [socketError]);

  const handleActiveCompositionFilterEntryChange = useCallback((
    nextEntry: ActiveCompositionFilterEntry | null,
  ) => {
    if (nextEntry) {
      setSuppressedCompositionEntryId(null);
    }

    setActiveCompositionFilterEntry((currentEntry) => {
      if (
        currentEntry?.entryId === nextEntry?.entryId &&
        currentEntry?.historyId === nextEntry?.historyId
      ) {
        return currentEntry;
      }
      if (currentEntry?.entryId !== nextEntry?.entryId) {
        setCompositionFilterCounts({});
      }
      return nextEntry;
    });
  }, []);

  const handleCompositionFilterBallTap = useCallback((ball: BallName) => {
    if (!activeCompositionFilterEntry) {
      return;
    }

    setCompositionFilterCounts((counts) =>
      nextCompositionFilterCounts({
        ball,
        counts,
        suggestions: activeCompositionFilterEntry.suggestions,
      }),
    );
  }, [activeCompositionFilterEntry]);

  const handleCompositionFilterCancel = useCallback(() => {
    setSuppressedCompositionEntryId(activeCompositionFilterEntry?.entryId ?? null);
    setActiveCompositionFilterEntry(null);
    setCompositionFilterCounts({});
  }, [activeCompositionFilterEntry]);

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col gap-2">
      {isReconnecting ? (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-warning-300/60 bg-warning-100 px-3 py-2 text-xs font-medium text-warning-800 shadow-sm dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-100"
          role="status"
        >
          <span>Connection lost. Reconnecting...</span>
          <span className="shrink-0 font-mono">
            Try {reconnectAttempt}
            {reconnectDelaySeconds !== null
              ? ` in ${reconnectDelaySeconds}s`
              : ""}
          </span>
        </div>
      ) : null}
      <div
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ${
          isCompositionResolutionMode
            ? "max-h-0 -translate-y-2 opacity-0"
            : "max-h-96 translate-y-0 opacity-100"
        }`}
        aria-hidden={isCompositionResolutionMode || undefined}
      >
        <FrameOverview />
      </div>
      <div className="flex-1 min-h-0 overflow-visible">
        <FrameLog
          activeCompositionFilterEntryId={activeCompositionFilterEntry?.entryId}
          compositionFilterCounts={compositionFilterCounts}
          isCompositionResolutionMode={isCompositionResolutionMode}
          suppressedAutoExpandedEntryId={suppressedCompositionEntryId}
          onActiveCompositionFilterEntryChange={
            handleActiveCompositionFilterEntryChange
          }
        />
      </div>
      {activeCompositionFilterEntry ? (
        <CompositionSuggestionFilterPanel
          counts={compositionFilterCounts}
          suggestions={activeCompositionFilterEntry.suggestions}
          onBallTap={handleCompositionFilterBallTap}
          onCancel={handleCompositionFilterCancel}
        />
      ) : (
        <ControlPanel />
      )}
    </div>
  );
}
