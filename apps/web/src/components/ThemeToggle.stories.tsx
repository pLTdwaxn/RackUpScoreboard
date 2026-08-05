import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ThemeToggle from "./ThemeToggle";

const meta = {
  title: "Navigation/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
