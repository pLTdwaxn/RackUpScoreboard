import { Card, Tabs } from "@heroui/react";
import { useAppDictionary } from "@/i18n/client";
import { JoinMatchForm, NewMatchForm } from ".";

type LobbyCardProps = {
  initialMatchroomId?: string;
};

const LobbyCard = ({ initialMatchroomId }: LobbyCardProps) => {
  const copy = useAppDictionary().lobby;

  return (
    <Tabs className="w-full h-full">
      <Card className="h-full">
        <Card.Header className="items-center">
          <Tabs.ListContainer>
            <Tabs.List aria-label={copy.joinOrCreateTabs}>
              <Tabs.Tab id="join-matchroom">
                {copy.join}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="create-matchroom">
                {copy.create}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Card.Header>
        <Card.Content>
          <Tabs.Panel id="join-matchroom">
            <JoinMatchForm initialMatchroomId={initialMatchroomId} />
          </Tabs.Panel>
          <Tabs.Panel id="create-matchroom">
            <NewMatchForm />
          </Tabs.Panel>
        </Card.Content>
      </Card>
    </Tabs>
  );
};

export default LobbyCard;
