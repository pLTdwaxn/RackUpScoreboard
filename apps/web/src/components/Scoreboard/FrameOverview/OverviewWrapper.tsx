import type { ReactNode } from "react";

const OverviewWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col items-stretch gap-2">{children}</div>;
};

export default OverviewWrapper;
