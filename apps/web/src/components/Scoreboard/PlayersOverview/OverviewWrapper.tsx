import { Card } from "@heroui/react";
import type { ReactNode } from "react";

export default function OverviewWrapper({ children }: { children: ReactNode }) {
  return (
    <Card
      variant="transparent"
      className="flex flex-col w-full p-0 max-w-md rounded-3xl gap-2"
    >
      <Card.Content className="flex flex-row gap-2">{children}</Card.Content>
    </Card>
  );
}
