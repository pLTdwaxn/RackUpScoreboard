import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { noop } from "@/stories/scoreboardFixtures";

import Menu from "./Menu";

const meta = {
  title: "Navigation/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    onLeaveRoom: noop,
  },
};
