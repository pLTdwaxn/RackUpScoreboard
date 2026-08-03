import { Button, Drawer, ListBox, Select } from "@heroui/react";

import {
  IconChevronDown,
  IconDotsFilled,
  IconLogout,
} from "@tabler/icons-react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  APP_LOCALE_OPTIONS,
  type AppLocale,
} from "@/i18n";
import { useI18n } from "@/i18n/client";
import { appVersionLabel } from "@/lib/version";

type MenuProps = {
  onLeaveRoom?: () => void;
};

export default function Menu({ onLeaveRoom }: MenuProps) {
  const { copy: appCopy, locale, setLocale } = useI18n();
  const copy = appCopy.sideDrawer;

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
              <Drawer.Heading>{copy.settings}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="flex flex-col gap-3">
              <div className="rounded-lg bg-default-100/60 p-3">
                <div className="flex items-center justify-between gap-4 border-b border-default-200 pb-3">
                  <span className="text-sm font-medium">{copy.theme}</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="text-sm font-medium">{copy.language}</span>
                  <Select
                    aria-label={copy.languageSelection}
                    className="w-32"
                    selectedKey={locale}
                    onSelectionChange={(key) => {
                      setLocale(String(key) as AppLocale);
                    }}
                    variant="secondary"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator>
                        <IconChevronDown size={16} stroke={2} />
                      </Select.Indicator>
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox items={APP_LOCALE_OPTIONS}>
                        {(locale) => (
                          <ListBox.Item
                            id={locale.id}
                            textValue={locale.nativeLabel}
                          >
                            {locale.nativeLabel}
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>
              <ListBox aria-label={copy.settings}>
                <ListBox.Item id="scorekeeping" textValue={copy.scorekeeping}>
                  {copy.scorekeeping}
                </ListBox.Item>
                <ListBox.Item id="players" textValue={copy.players}>
                  {copy.players}
                </ListBox.Item>
                <ListBox.Item id="match-rules" textValue={copy.matchRules}>
                  {copy.matchRules}
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
                    {copy.leaveRoom}
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
