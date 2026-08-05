import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  foulShotFact,
  noop,
  scoringShotFact,
  storyFrameLogEntries,
  storyPlayers,
  summaryBreakFact,
} from "@/stories/scoreboardFixtures";

import BallComposition from "./BallComposition";
import BallCompositionScroller from "./BallCompositionScroller";
import FrameLogFactMessage from "./FrameLogFactMessage";
import LogEntry from "./LogEntry";
import LogEntryPanel from "./LogEntryPanel";
import LogEntryUndoButton from "./LogEntryUndoButton";
import ResolutionFocusMessage from "./ResolutionFocusMessage";
import ShotHistory from "./ShotHistory";
import UndoSlot from "./UndoSlot";

const meta = {
  title: "Scoreboard/Frame Log",
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

const breakEntry = storyFrameLogEntries[1];
const unresolvedEntry = storyFrameLogEntries[2];
const currentEntry = storyFrameLogEntries[3];

export const BallCompositionGrouped: Story = {
  render: () => (
    <BallComposition
      entryId="composition"
      pottedBalls={["red", "black", "red", "black", "red", "pink"]}
      tokenSize="md"
    />
  ),
};

export const BallCompositionWithFreeBall: Story = {
  render: () => (
    <BallComposition
      entryId="free-ball"
      pottedBalls={["blue", "black", "red", "pink"]}
      freeBallPots={[{ potted_ball: "blue", counts_as: "red" }]}
      tokenSize="md"
    />
  ),
};

export const BallCompositionScrollerStory: Story = {
  name: "BallCompositionScroller",
  render: () => <BallCompositionScroller entry={breakEntry} />,
};

export const FactMessages: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      <FrameLogFactMessage
        facts={[scoringShotFact]}
        fallbackPlayerName="Fermin"
        players={storyPlayers}
      />
      <FrameLogFactMessage
        facts={[foulShotFact]}
        fallbackPlayerName="George"
        players={storyPlayers}
      />
      <FrameLogFactMessage
        facts={[summaryBreakFact]}
        fallbackPlayerName="Fermin"
        players={storyPlayers}
      />
    </div>
  ),
};

export const ShotHistoryList: Story = {
  render: () => (
    <ShotHistory entry={breakEntry} isExpanded players={storyPlayers} />
  ),
};

export const LogEntryCollapsed: Story = {
  render: () => (
    <ol className="flex flex-col">
      <LogEntry
        entry={breakEntry}
        canUndo
        onUndo={noop}
        players={storyPlayers}
        playerTheme="blue"
      />
    </ol>
  ),
};

export const LogEntryExpanded: Story = {
  render: () => (
    <ol className="flex flex-col">
      <LogEntry
        entry={breakEntry}
        canUndo
        onUndo={noop}
        players={storyPlayers}
        playerTheme="blue"
        isExpanded
      />
    </ol>
  ),
};

export const UnresolvedSummaryBreak: Story = {
  render: () => (
    <ol className="flex flex-col">
      <LogEntry
        entry={unresolvedEntry}
        canUndo
        onUndo={noop}
        players={storyPlayers}
        playerTheme="blue"
        isExpanded
        onResolveBreakComposition={noop}
      />
    </ol>
  ),
};

export const ResolutionFocusPanel: Story = {
  render: () => (
    <LogEntryPanel
      entry={unresolvedEntry}
      isExpanded
      isResolutionFocusMode
      players={storyPlayers}
      compositionFilterCounts={{ red: 3, black: 2 }}
      onResolveBreakComposition={noop}
    />
  ),
};

export const CurrentTurnEntry: Story = {
  render: () => (
    <ol className="flex flex-col">
      <LogEntry
        entry={currentEntry}
        canUndo={false}
        onUndo={noop}
        players={storyPlayers}
        playerTheme="red"
      />
    </ol>
  ),
};

export const UndoButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UndoSlot canUndo onUndo={noop} />
      <UndoSlot canUndo={false} onUndo={noop} />
      <LogEntryUndoButton canUndo onUndo={noop} />
    </div>
  ),
};

export const ResolutionMessage: Story = {
  render: () => <ResolutionFocusMessage />,
};
