"use client";

import { useEffect, useState } from "react";

import { Button, Popover } from "@heroui/react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  IconChevronDown,
  IconChevronUp,
  IconLogout,
  IconQrcode,
} from "@tabler/icons-react";
import { Match } from "@/types";

type MatchroomOverviewProps = {
  roomReady: boolean;
  playerCount: number;
  matchroomId: string;
  match: Match | null;
  resetRoom: () => void;
};

export default function MatchroomOverview({
  roomReady,
  playerCount,
  matchroomId,
  match,
  resetRoom,
}: MatchroomOverviewProps) {
  return (
    <MatchroomOverviewPopover
      key={playerCount}
      defaultOpen={playerCount === 1}
      roomReady={roomReady}
      matchroomId={matchroomId}
      match={match}
      resetRoom={resetRoom}
    />
  );
}

type MatchroomOverviewPopoverProps = Omit<
  MatchroomOverviewProps,
  "playerCount"
> & {
  defaultOpen: boolean;
};

function MatchroomOverviewPopover({
  defaultOpen,
  roomReady,
  matchroomId,
  match,
  resetRoom,
}: MatchroomOverviewPopoverProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function buildQrCode() {
      try {
        const roomUrl = `${window.location.origin}/matchroom/${encodeURIComponent(matchroomId)}`;
        const dataUrl = await QRCode.toDataURL(roomUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 256,
        });

        if (isActive) {
          setQrCodeDataUrl(dataUrl);
          setQrCodeError(null);
        }
      } catch {
        if (isActive) {
          setQrCodeDataUrl(null);
          setQrCodeError("Could not generate QR code.");
        }
      }
    }

    buildQrCode();

    return () => {
      isActive = false;
    };
  }, [matchroomId]);

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        slot="trigger"
        variant="ghost"
        className="flex w-auto items-center justify-between"
      >
        <IconQrcode stroke={2} />
        {match ? (
          <>
            <span className="ml-2">{match.match_importance}</span>
          </>
        ) : (
          <span>
            {roomReady ? `Matchroom ${matchroomId}` : "Waiting for Opponent..."}
          </span>
        )}

        {isOpen ? <IconChevronUp stroke={2} /> : <IconChevronDown stroke={2} />}
      </Button>

      <Popover.Content placement="bottom" className="w-80">
        <Popover.Dialog className="flex flex-col items-center text-center gap-2 ">
          <p>
            Invite your opponent to join the matchroom by sharing the QR code or
            the link below:
          </p>
          <span className="text-3xl font-mono font-bold">{matchroomId}</span>
          <div className="flex flex-col items-center gap-3">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt={`QR code for matchroom ${matchroomId}`}
                width={256}
                height={256}
                unoptimized={true}
                className="h-48 w-48 rounded-2xl  p-3"
              />
            ) : qrCodeError ? (
              <p className="text-sm text-danger">{qrCodeError}</p>
            ) : null}
          </div>
          <Button
            variant="danger-soft"
            size="sm"
            onPress={() => {
              resetRoom();
              setIsOpen(false);
            }}
          >
            <IconLogout stroke={2} />
            Leave Room
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
