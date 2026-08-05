import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { storyMatch } from "@/stories/scoreboardFixtures";

import MatchroomInviteDrawer from "./MatchroomInviteDrawer";
import MatchroomOverview from "./MatchroomOverview";

const meta = {
  title: "Scoreboard/Matchroom",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <MatchroomOverview
      roomReady
      playerCount={2}
      matchroomId="ABCD1234"
      clubId="RackUp Club"
      match={storyMatch}
    />
  ),
};

export const WaitingOverview: Story = {
  render: () => (
    <MatchroomOverview
      roomReady={false}
      playerCount={1}
      matchroomId="ABCD1234"
      match={null}
    />
  ),
};

export const InviteDrawerClosed: Story = {
  render: () => <MatchroomInviteDrawer matchroomId="ABCD1234" />,
};

export const InviteDrawerOpen: Story = {
  render: () => (
    <MatchroomInviteDrawer defaultOpen matchroomId="ABCD1234" />
  ),
};
