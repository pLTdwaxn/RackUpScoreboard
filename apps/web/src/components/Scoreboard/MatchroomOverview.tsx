"use client";

import { useState } from "react";

import { Button, Popover } from "@heroui/react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { AppDictionary } from "@/i18n";
import { useAppDictionary } from "@/i18n/client";
import { Match } from "@/types";

type MatchroomOverviewProps = {
  roomReady: boolean;
  playerCount: number;
  matchroomId: string;
  clubId?: string;
  match: Match | null;
};

export default function MatchroomOverview({
  roomReady,
  matchroomId,
  clubId,
  match,
}: MatchroomOverviewProps) {
  return (
    <MatchroomOverviewPopover
      roomReady={roomReady}
      matchroomId={matchroomId}
      clubId={clubId}
      match={match}
    />
  );
}

type MatchroomOverviewPopoverProps = Omit<
  MatchroomOverviewProps,
  "playerCount"
>;

function MatchroomOverviewPopover({
  roomReady,
  matchroomId,
  clubId,
  match,
}: MatchroomOverviewPopoverProps) {
  const copy = useAppDictionary().matchroomOverview;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        slot="trigger"
        variant="ghost"
        className="flex w-auto items-center justify-between"
      >
        {match ? (
          <>
            <span>{matchOverviewLabel(match, copy)}</span>
          </>
        ) : (
          <span>
            {roomReady
              ? copy.matchroom(matchroomId)
              : copy.waitingForOpponent}
          </span>
        )}

        {isOpen ? <IconChevronUp stroke={2} /> : <IconChevronDown stroke={2} />}
      </Button>

      <Popover.Content placement="bottom" className="w-80">
        <Popover.Dialog className="flex flex-col gap-3 text-left">
          <MatchDetail
            label={copy.match}
            value={match?.name || copy.matchNotSet}
          />
          <MatchDetail
            label={copy.club}
            value={clubId ? clubId : copy.clubNotSet}
          />
          <MatchDetail
            label={copy.importance}
            value={match?.match_importance || copy.importanceNotSet}
          />
          <MatchDetail
            label={copy.winningCondition}
            value={match ? matchOverviewLabel(match, copy) : copy.conditionNotSet}
          />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function MatchDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-default-100/60 p-3">
      <span className="block text-xs font-medium uppercase text-muted">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function matchOverviewLabel(
  match: Match,
  copy: AppDictionary["matchroomOverview"],
): string {
  if (!match.frames_to_win) {
    return match.match_importance;
  }

  return copy.bestOf(match.frames_to_win * 2 - 1);
}
