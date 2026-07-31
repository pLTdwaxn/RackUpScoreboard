import { ScrollShadow } from "@heroui/react";
import { useRef } from "react";

import type { FrameLogEntry, Player } from "@/types";
import FrameLogFactMessage from "./FrameLogFactMessage";
import useScrollToEnd from "./useScrollToEnd";

type ShotHistoryProps = {
  entry: FrameLogEntry;
  isExpanded: boolean;
  players: Player[];
};

export default function ShotHistory({
  entry,
  isExpanded,
  players,
}: ShotHistoryProps) {
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
