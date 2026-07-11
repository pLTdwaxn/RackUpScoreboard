"use client";

import { useEffect } from "react";
import { toast } from "@heroui/react";

import { useMatchroomSession } from "@/hooks/useSocket";

import { Controls, FrameOverview, PlayersOverview, MatchLog } from ".";

export default function Scoreboard() {
  const { socketError } = useMatchroomSession();

  useEffect(() => {
    if (!socketError) {
      return;
    }

    toast.danger(socketError, { timeout: 1000 });
  }, [socketError]);

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col gap-2">
      <PlayersOverview />
      <FrameOverview />
      <div className="flex-1 min-h-0">
        <MatchLog />
      </div>
      <Controls />
    </div>
  );
}
