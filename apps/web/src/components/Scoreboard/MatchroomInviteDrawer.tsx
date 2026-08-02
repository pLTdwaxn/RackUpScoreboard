"use client";

import { useEffect, useState } from "react";

import { Button, Drawer } from "@heroui/react";
import { IconQrcode } from "@tabler/icons-react";
import Image from "next/image";
import QRCode from "qrcode";

type MatchroomInviteDrawerProps = {
  defaultOpen?: boolean;
  matchroomId: string;
};

export default function MatchroomInviteDrawer({
  defaultOpen = false,
  matchroomId,
}: MatchroomInviteDrawerProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchroomId) {
      return;
    }

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

  if (!matchroomId) {
    return null;
  }

  return (
    <Drawer defaultOpen={defaultOpen}>
      <Button
        aria-label="Open matchroom invite"
        isIconOnly
        variant="ghost"
        className="rounded-full"
      >
        <IconQrcode stroke={2} />
      </Button>
      <Drawer.Backdrop variant="transparent">
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Invite Player</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-muted">
                  Share this QR code or room code with your opponent.
                </p>
                <span className="font-mono text-3xl font-bold">
                  {matchroomId}
                </span>
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt={`QR code for matchroom ${matchroomId}`}
                    width={256}
                    height={256}
                    unoptimized={true}
                    className="h-48 w-48 rounded-2xl p-3"
                  />
                ) : qrCodeError ? (
                  <p className="text-sm text-danger">{qrCodeError}</p>
                ) : null}
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
