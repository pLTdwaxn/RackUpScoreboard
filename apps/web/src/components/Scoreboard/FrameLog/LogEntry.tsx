import { Card } from "@heroui/react";

import { FrameLogEntry } from "@/types";
import PlayerAvatar from "@/components/Scoreboard/shared/PlayerAvatar";
import {
  getAvatarColors,
  getPlayerInitials,
} from "@/components/Scoreboard/shared/playerIdentity";
import BallComposition from "./BallComposition";
import UndoSlot from "./UndoSlot";

type LogEntryProps = {
  entry: FrameLogEntry;
  isCurrentUser: boolean;
  canUndo: boolean;
  onUndo: () => void;
};

function actionLabel(entry: FrameLogEntry): string {
  if (entry.result === "frame_won") {
    return "won the frame";
  }

  if (entry.foul_points > 0 && entry.break_points > 0) {
    return `${entry.break_points} Break, Foul ${entry.foul_points}`;
  }

  if (entry.foul_points > 0) {
    return `Foul ${entry.foul_points}`;
  }

  if (entry.break_points > 0) {
    return `Break ${entry.break_points}`;
  }

  return "Shot Taken";
}

export default function LogEntry({
  entry,
  isCurrentUser,
  canUndo,
  onUndo,
}: LogEntryProps) {
  const { avatarColor, avatarColor2 } = getAvatarColors(entry.player_name);
  const initials = getPlayerInitials(entry.player_name);
  const isCurrentBreak = entry.result === "in_progress";

  return (
    <li className="flex w-full flex-col">
      <div className="flex flex-row items-center gap-2">
        <div
          className={`flex min-w-0 flex-1 ${
            isCurrentUser ? "justify-end" : "justify-start"
          }`}
        >
          <Card
            variant="secondary"
            className={`w-fit max-w-full p-1 ${
              isCurrentBreak ? "current-break-glow" : ""
            }`}
          >
            <Card.Content className="flex flex-row items-center gap-2 p-0">
              <div
                className={`flex min-w-0 items-center gap-2 ${
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <PlayerAvatar
                  size="sm"
                  avatarColor={avatarColor}
                  avatarColor2={avatarColor2}
                  initials={initials}
                />

                <BallComposition
                  entryId={entry.id}
                  pottedBalls={entry.potted_balls}
                />
              </div>
            </Card.Content>
          </Card>
        </div>
        <UndoSlot canUndo={canUndo} onUndo={onUndo} />
      </div>
      <div className="flex flex-row min-w-0 flex-1 justify-center py-0.5">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {entry.player_name}
        </span>
        <span className="pl-2 shrink-0 text-sm text-muted">
          {actionLabel(entry)}
        </span>
      </div>
    </li>
  );
}
