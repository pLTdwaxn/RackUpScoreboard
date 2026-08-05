import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import JoinMatchForm from "./JoinMatchForm";
import LobbyCard from "./LobbyCard";
import NewMatchForm from "./NewMatchForm";

const meta = {
  title: "Lobby",
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

export const LobbyTabs: Story = {
  render: () => <LobbyCard initialMatchroomId="ABCD1234" />,
};

export const CreateMatch: Story = {
  render: () => <NewMatchForm />,
};

export const JoinMatch: Story = {
  render: () => <JoinMatchForm initialMatchroomId="ABCD1234" />,
};
