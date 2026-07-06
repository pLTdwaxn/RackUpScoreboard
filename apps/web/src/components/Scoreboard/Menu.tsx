import { Button, Drawer } from "@heroui/react";

import { IconDotsFilled } from "@tabler/icons-react";

export default function Menu() {
  return (
    <Drawer>
      <Button isIconOnly={true} variant="secondary" className="rounded-full">
        <IconDotsFilled />
      </Button>
      <Drawer.Backdrop variant="blur">
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Settings</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>ABC</Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
