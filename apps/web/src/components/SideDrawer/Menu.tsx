import { Button, Drawer, ListBox } from "@heroui/react";

import { IconDotsFilled, IconLogout } from "@tabler/icons-react";
import ThemeToggle from "@/components/ThemeToggle";
import { appVersionLabel } from "@/lib/version";

type MenuProps = {
  onLeaveRoom?: () => void;
};

export default function Menu({ onLeaveRoom }: MenuProps) {
  return (
    <Drawer>
      <Button isIconOnly={true} variant="ghost" className="rounded-full">
        <IconDotsFilled />
      </Button>
      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Settings</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="flex flex-col gap-3">
              <div className="rounded-lg bg-default-100/60 p-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              <ListBox aria-label="Settings">
                <ListBox.Item id="scorekeeping" textValue="Scorekeeping">
                  Scorekeeping
                </ListBox.Item>
                <ListBox.Item id="players" textValue="Players">
                  Players
                </ListBox.Item>
                <ListBox.Item id="match-rules" textValue="Match rules">
                  Match rules
                </ListBox.Item>
              </ListBox>
            </Drawer.Body>
            <Drawer.Footer className="items-end justify-between">
              <div>
                {onLeaveRoom ? (
                  <Button
                    className="justify-start"
                    variant="danger-soft"
                    size="sm"
                    onPress={onLeaveRoom}
                  >
                    <IconLogout stroke={2} />
                    Leave Room
                  </Button>
                ) : null}
              </div>
              <span className="font-mono text-xs text-muted">
                {appVersionLabel}
              </span>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
