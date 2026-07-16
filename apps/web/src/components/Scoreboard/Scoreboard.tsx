"use client";

import { useEffect } from "react";
import { toast } from "@heroui/react";

import { useMatchroomSession } from "@/hooks/useSocket";

import { Controls, FrameOverview, FrameLog } from ".";
import PlayersOverview from "./PlayersOverview";

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
      <FrameOverview />
      <PlayersOverview />
      <div className="flex-1 min-h-0 overflow-visible">
        <FrameLog />
      </div>
      <Controls />
    </div>
  );
}
