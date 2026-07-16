"use client";

import { Surface } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import Menu from "@/components/SideDrawer/Menu";
import ThemeToggle from "@/components/ThemeToggle";
import TopRow from "@/components/TopBar/TopBar";
import {
  MatchroomProvider,
  useMatchroomGame,
  useMatchroomSession,
} from "@/hooks/useSocket";
import { buildScoreboardViewModel } from "@/lib/viewModel";

function MatchroomTopRowContent() {
  const router = useRouter();
  const { matchroomId } = useMatchroomSession();
  const { gameState } = useMatchroomGame();
  const viewModel = buildScoreboardViewModel({ gameState });

  if (!matchroomId) {
    return <span className="text-sm font-medium">Create Match</span>;
  }

  return (
    <MatchroomOverview
      roomReady={viewModel.roomReady}
      matchroomId={matchroomId}
      match={viewModel.match}
      resetRoom={() => {
        router.push("/");
      }}
    />
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string }>();
  const matchroomId = typeof params?.id === "string" ? params.id : "";

  return (
    <MatchroomProvider matchroomId={matchroomId}>
      <Surface
        variant="tertiary"
        className="flex h-dvh w-full max-w-md flex-col overflow-hidden p-0"
      >
        <TopRow>
          <Menu />
          <MatchroomTopRowContent />
          <ThemeToggle />
        </TopRow>
        <div className="flex flex-1 min-h-0 w-full items-stretch justify-center overflow-hidden p-2">
          {children}
        </div>
      </Surface>
    </MatchroomProvider>
  );
}
