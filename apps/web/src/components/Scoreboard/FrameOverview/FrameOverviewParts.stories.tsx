import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  storyFrame,
  storyPartiallyDetailedFrame,
  storyPlayers,
} from "@/stories/scoreboardFixtures";

import FrameStats from "./FrameStats";
import OverviewWrapper from "./OverviewWrapper";
import ScoreCard from "./ScoreCard";

const meta = {
  title: "Scoreboard/Frame Overview/Parts",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stats: Story = {
  render: () => (
    <div className="w-96">
      <FrameStats frame={storyFrame} />
    </div>
  ),
};

export const UnknownTableStateStats: Story = {
  render: () => (
    <div className="w-96">
      <FrameStats frame={storyPartiallyDetailedFrame} />
    </div>
  ),
};

export const OverviewComposition: Story = {
  render: () => (
    <div className="w-[390px]">
      <OverviewWrapper>
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard
            player={storyPlayers[0]}
            frame={storyFrame}
            currentTurn
            playerTheme="blue"
          />
          <ScoreCard
            player={storyPlayers[1]}
            frame={storyFrame}
            currentTurn={false}
            playerTheme="red"
          />
        </div>
        <FrameStats frame={storyFrame} />
      </OverviewWrapper>
    </div>
  ),
};
