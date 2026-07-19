import { Button, Drawer } from "@heroui/react";

import { IconDotsFilled } from "@tabler/icons-react";
import { appVersionLabel } from "@/lib/version";

export default function Menu() {
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
            <Drawer.Body>
              <div className="rounded-lg border border-default-200 bg-default-100/60 p-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Version</span>
                  <span className="font-mono text-sm text-muted">
                    {appVersionLabel}
                  </span>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
