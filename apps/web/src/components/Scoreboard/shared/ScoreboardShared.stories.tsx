import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { storyPlayers } from "@/stories/scoreboardFixtures";

import PlayerAvatar from "./PlayerAvatar";
import PlayerCard from "./PlayerCard";
import PlayerName, { PlayerNameText } from "./PlayerName";
import SnookerBallToken from "./SnookerBallToken";

const meta = {
  title: "Scoreboard/Shared",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <PlayerAvatar initials="FE" className="player-theme-blue" />
      <PlayerAvatar initials="GE" className="player-theme-red" />
    </div>
  ),
};

export const PlayerCards: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <PlayerCard player={storyPlayers[0]} theme="blue" />
      <PlayerCard player={storyPlayers[1]} theme="red" direction="rtl" />
    </div>
  ),
};

export const PlayerNames: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <PlayerName player={storyPlayers[0]} reverseDirection={false} theme="blue" />
      <PlayerName player={storyPlayers[1]} reverseDirection theme="red" />
      <PlayerNameText name="Waiting" theme="neutral" />
    </div>
  ),
};

export const SnookerBalls: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {["red", "yellow", "green", "brown", "blue", "pink", "black"].map(
        (ball) => (
          <SnookerBallToken key={ball} ball={ball} label={ball} size="md" />
        ),
      )}
      <SnookerBallToken
        ball="blue"
        effectiveBall="red"
        label="blue counts as red"
        size="md"
      />
    </div>
  ),
};
