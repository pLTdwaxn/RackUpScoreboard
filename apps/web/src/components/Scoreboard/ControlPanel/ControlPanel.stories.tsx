import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BallName } from "@/domain/balls";
import {
  noop,
  storyFrame,
  storyFrameSummary,
  storyPlayers,
  summaryBreakSuggestions,
} from "@/stories/scoreboardFixtures";

import AdvancedScoringPanel from "./Advanced/AdvancedScoringPanel";
import CompositionSuggestionFilterPanel from "./CompositionSuggestionFilterPanel";
import ConcedeFrameDialog from "./ConcedeFrameDialog";
import ControlPanelLayout from "./ControlPanelLayout";
import FinishedFramePanel from "./FinishedFramePanel";
import SimpleScoringPanel from "./Simple/SimpleScoringPanel";
import SummaryBreakFields from "./Simple/SummaryBreakFields";

const coloursOnTable = storyFrame.colours_on_table;
const onBallTap = (ball: BallName) => {
  void ball;
};

const meta = {
  title: "Scoreboard/Control Panel",
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

export const Layout: Story = {
  render: () => (
    <ControlPanelLayout
      messageRow={<span className="text-sm text-muted">Scorekeeping for Fermin</span>}
      ballRow={<div className="rounded-lg bg-default-100 p-4 text-center">Ball rail</div>}
      actionsRow={<div className="rounded-lg bg-default-100 p-4 text-center">Actions</div>}
    />
  ),
};

export const Simple: Story = {
  render: () => (
    <SimpleScoringPanel
      redsRemaining={15}
      coloursOnTable={coloursOnTable}
      objectBall="red"
      freeBall={null}
      scoreKeeper="opp"
      scorekeepingTarget={{ player: storyPlayers[0], theme: "blue" }}
      canKeepScore
      canLogSummaryBreak
      canUseFoulOptions={false}
      freeBallMode={false}
      isSummaryBreakMode={false}
      selectedBalls={[]}
      onBallTap={onBallTap}
      onLogBreak={noop}
      onConcede={noop}
      onEnterAdvancedMode={noop}
      onToggleSummaryBreakMode={noop}
      onDeclareFoul={noop}
      onEndTurn={noop}
      onPassShot={noop}
      onDeclareFreeBall={noop}
    />
  ),
};

export const SimpleWithUnknownReds: Story = {
  render: () => (
    <SimpleScoringPanel
      redsRemaining={null}
      coloursOnTable={coloursOnTable}
      objectBall="red"
      freeBall={null}
      scoreKeeper="any"
      canKeepScore
      canLogSummaryBreak={false}
      canUseFoulOptions={false}
      freeBallMode={false}
      isSummaryBreakMode={false}
      selectedBalls={["red"]}
      onBallTap={onBallTap}
      onLogBreak={noop}
      onConcede={noop}
      onEnterAdvancedMode={noop}
      onToggleSummaryBreakMode={noop}
      onDeclareFoul={noop}
      onEndTurn={noop}
      onPassShot={noop}
      onDeclareFreeBall={noop}
    />
  ),
};

export const ManualBreakLogging: Story = {
  render: () => (
    <SimpleScoringPanel
      redsRemaining={15}
      coloursOnTable={coloursOnTable}
      objectBall="red"
      freeBall={null}
      scoreKeeper="self"
      scorekeepingTarget={{ player: storyPlayers[0], theme: "blue" }}
      canKeepScore
      canLogSummaryBreak
      canUseFoulOptions={false}
      freeBallMode={false}
      isSummaryBreakMode
      selectedBalls={[]}
      onBallTap={onBallTap}
      onLogBreak={noop}
      onConcede={noop}
      onEnterAdvancedMode={noop}
      onToggleSummaryBreakMode={noop}
      onDeclareFoul={noop}
      onEndTurn={noop}
      onPassShot={noop}
      onDeclareFreeBall={noop}
    />
  ),
};

export const Advanced: Story = {
  render: () => (
    <AdvancedScoringPanel
      summary="Pot 2 reds and a black"
      statusChip={{ label: "LEGAL", color: "success" }}
      redsRemaining={15}
      coloursOnTable={coloursOnTable}
      objectBall="red"
      freeBall={null}
      canKeepScore
      redSelections={2}
      foulMode={false}
      selectedBalls={["red", "red", "black"]}
      isRedFoulWithoutPot={false}
      comboIsFoul={false}
      hasSelectedBalls
      onBallTap={onBallTap}
      onResetRedSelections={noop}
      onExitAdvancedMode={noop}
      onChangeFoulMode={noop}
      onSubmit={noop}
    />
  ),
};

export const AdvancedFoul: Story = {
  render: () => (
    <AdvancedScoringPanel
      summary="Declare foul on black"
      statusChip={{ label: "FOUL", color: "danger" }}
      redsRemaining={15}
      coloursOnTable={coloursOnTable}
      objectBall="red"
      freeBall={null}
      canKeepScore
      redSelections={0}
      foulMode
      selectedBalls={["black"]}
      isRedFoulWithoutPot={false}
      comboIsFoul
      hasSelectedBalls
      onBallTap={onBallTap}
      onResetRedSelections={noop}
      onExitAdvancedMode={noop}
      onChangeFoulMode={noop}
      onSubmit={noop}
    />
  ),
};

export const SummaryBreakFieldsOnly: Story = {
  render: () => <SummaryBreakFields canKeepScore onSubmit={noop} />,
};

export const CompositionFilter: Story = {
  render: () => (
    <CompositionSuggestionFilterPanel
      counts={{ red: 3, black: 2 }}
      suggestions={summaryBreakSuggestions}
      onBallTap={onBallTap}
      onCancel={noop}
    />
  ),
};

export const FinishedFrame: Story = {
  render: () => (
      <FinishedFramePanel
        winnerKey="p1"
        currentPlayerKey="p1"
        players={storyPlayers}
        summary={storyFrameSummary}
        hasConfirmedNextFrame={false}
        onNextFrame={noop}
      />
  ),
};

export const FinishedFrameWaiting: Story = {
  render: () => (
      <FinishedFramePanel
        winnerKey="p2"
        currentPlayerKey="p1"
        players={storyPlayers}
        summary={storyFrameSummary}
        hasConfirmedNextFrame
        onNextFrame={noop}
      />
  ),
};

export const ConcedeDialogOpen: Story = {
  render: () => (
    <ConcedeFrameDialog open onOpenChange={noop} onConfirm={noop} />
  ),
};
