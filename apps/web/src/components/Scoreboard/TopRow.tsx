import { Children, type ReactNode } from "react";

type TopRowProps = {
  children: ReactNode;
};

export default function TopRow({ children }: TopRowProps) {
  const [leftChild, centerChild, rightChild] = Children.toArray(children);

  return (
    <div className="flex w-full flex-row items-center">
      <div className="flex flex-1 justify-start">{leftChild}</div>
      <div className="flex flex-1 justify-center">{centerChild}</div>
      <div className="flex flex-1 justify-end">{rightChild}</div>
    </div>
  );
}
