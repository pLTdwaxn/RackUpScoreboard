import { Card } from "@heroui/react";
import { Frame } from "@/types";

const FrameStats = ({ frame }: { frame: Frame }) => {
  return (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-row justify-between">
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Remaining</h3>
          <p className="score-secondary">{frame.points_remaining}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Gap</h3>
          <p className="score-secondary">{frame.points_gap}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Snks Needed</h3>
          <p className="score-secondary">{frame.snookers_required}</p>
        </div>
      </Card.Content>
    </Card>
  );
};

export default FrameStats;
