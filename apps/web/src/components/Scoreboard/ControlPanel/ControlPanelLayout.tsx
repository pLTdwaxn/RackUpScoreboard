import { ReactNode } from "react";

type ControlPanelLayoutProps = {
  messageRow?: ReactNode;
  ballRow: ReactNode;
  redsRow?: ReactNode;
  actionsRow: ReactNode;
};

export default function ControlPanelLayout({
  messageRow,
  ballRow,
  redsRow,
  actionsRow,
}: ControlPanelLayoutProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {messageRow ? (
        <div className="flex w-full items-center justify-center">
          {messageRow}
        </div>
      ) : null}
      <div className="flex min-h-16 w-full items-center justify-center">
        {ballRow}
      </div>
      {redsRow ? (
        <div className="flex w-full items-center justify-center">{redsRow}</div>
      ) : null}
      <div className="flex w-full items-center justify-center">
        {actionsRow}
      </div>
    </div>
  );
}
