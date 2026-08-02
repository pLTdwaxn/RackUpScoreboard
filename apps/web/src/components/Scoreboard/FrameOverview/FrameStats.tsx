import { Card } from "@heroui/react";
import { useAppDictionary } from "@/i18n/client";
import { Frame } from "@/types";

const FrameStats = ({ frame }: { frame: Frame }) => {
  const copy = useAppDictionary().frameOverview;
  const pointsRemaining = frame.points_remaining ?? "?";
  const snookersRequired = frame.snookers_required ?? "?";

  return (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-row justify-between">
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">{copy.remaining}</h3>
          <p className="score-secondary">{pointsRemaining}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">{copy.gap}</h3>
          <p className="score-secondary">{frame.points_gap}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">{copy.snookersNeeded}</h3>
          <p className="score-secondary">{snookersRequired}</p>
        </div>
      </Card.Content>
    </Card>
  );
};

export default FrameStats;
