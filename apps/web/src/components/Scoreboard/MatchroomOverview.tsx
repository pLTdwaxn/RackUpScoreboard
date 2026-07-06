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

type MatchroomOverviewProps = {
  roomReady: boolean;
  matchroomId: string;
  resetRoom: () => void;
};

export default function MatchroomOverview({
  roomReady,
  matchroomId,
  resetRoom,
}: MatchroomOverviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function buildQrCode() {
      try {
        const roomUrl = `${window.location.origin}/app?matchroom=${encodeURIComponent(matchroomId)}`;
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
        variant="secondary"
        className="flex w-auto items-center justify-between"
      >
        <IconQrcode stroke={2} />
        <span>{roomReady ? "Matchroom" : "Waiting for Opponent..."}</span>
        <span className="min-w-0 flex-1 truncate font-mono">{matchroomId}</span>
        {isOpen ? <IconChevronUp stroke={2} /> : <IconChevronDown stroke={2} />}
      </Button>

      <Popover.Content>
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
                className="h-48 w-48 rounded-2xl bg-white p-3"
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
