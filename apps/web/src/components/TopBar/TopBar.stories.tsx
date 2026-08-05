import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@heroui/react";
import { IconMenu2, IconQrcode } from "@tabler/icons-react";

import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import { storyMatch } from "@/stories/scoreboardFixtures";

import TopBar from "./TopBar";

const meta = {
  title: "Top Bar/TopBar",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[390px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Matchroom: Story = {
  render: () => (
    <TopBar>
      <Button isIconOnly variant="ghost" className="rounded-full">
        <IconMenu2 />
      </Button>
      <MatchroomOverview
        roomReady
        playerCount={2}
        matchroomId="ABCD1234"
        clubId="RackUp Club"
        match={storyMatch}
      />
      <Button isIconOnly variant="ghost" className="rounded-full">
        <IconQrcode />
      </Button>
    </TopBar>
  ),
};
