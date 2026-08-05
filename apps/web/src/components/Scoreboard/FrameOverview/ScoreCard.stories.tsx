import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  storyFrame,
  storyPlayers,
  storyWaitingPlayer,
} from "@/stories/scoreboardFixtures";

import ScoreCard from "./ScoreCard";

const meta = {
  title: "Scoreboard/Frame Overview/ScoreCard",
  component: ScoreCard,
  args: {
    frame: storyFrame,
    player: storyPlayers[0],
    currentTurn: true,
    playerTheme: "blue",
  },
  decorators: [
    (Story) => (
      <div className="w-[190px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScoreCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CurrentTurn: Story = {};

export const WaitingPlayer: Story = {
  args: {
    player: storyWaitingPlayer,
    currentTurn: false,
    playerTheme: "neutral",
  },
};

export const FrameWinner: Story = {
  args: {
    player: storyPlayers[0],
    currentTurn: false,
    isFrameWinner: true,
    playerTheme: "red",
  },
};

export const Opponent: Story = {
  args: {
    player: storyPlayers[1],
    currentTurn: false,
    playerTheme: "red",
  },
};
