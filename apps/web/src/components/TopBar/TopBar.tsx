import { Surface } from "@heroui/react/surface";
import { Children, type ReactNode } from "react";

type TopBarProps = {
  children: ReactNode;
};

export default function TopBar({ children }: TopBarProps) {
  const [leftChild, centerChild, rightChild] = Children.toArray(children);

  return (
    <Surface
      variant="default"
      className="flex w-full flex-row items-center p-1 bg-background"
    >
      <div className="flex flex-1 justify-start">{leftChild}</div>
      <div className="flex flex-1 justify-center">{centerChild}</div>
      <div className="flex flex-1 justify-end">{rightChild}</div>
    </Surface>
  );
}
