import { Card, Tabs } from "@heroui/react";
import { JoinMatchForm, NewMatchForm } from ".";

const LobbyCard = () => {
  return (
    <Tabs className="w-full h-full">
      <Card className="h-full">
        <Card.Header className="items-center">
          <Tabs.ListContainer>
            <Tabs.List aria-label="Join or create a matchroom">
              <Tabs.Tab id="join-matchroom">
                Join
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="create-matchroom">
                Create
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Card.Header>
        <Card.Content>
          <Tabs.Panel id="join-matchroom">
            <JoinMatchForm />
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
