"use client";

import { useParams } from "next/navigation";

import { JoinMatchForm } from "@/components/Lobby";
import Scoreboard from "@/components/Scoreboard/Scoreboard";
import { useMatchroomSession } from "@/hooks/useSocket";

export default function MatchPage() {
  const params = useParams<{ id?: string }>();
  const { hydrated, hasRoomSession, readyToRenderRoom } = useMatchroomSession();
  const matchroomId = typeof params.id === "string" ? params.id : "";

  if (!hydrated || !hasRoomSession) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-background/80 p-4 shadow-sm backdrop-blur">
          <JoinMatchForm initialMatchroomId={matchroomId} />
        </div>
      </div>
    );
  }

  if (!readyToRenderRoom) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-sm text-muted">
        Connecting to matchroom...
      </div>
    );
  }

  return <Scoreboard />;
}
