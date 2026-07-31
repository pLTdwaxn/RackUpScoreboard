import { useEffect } from "react";
import type { RefObject } from "react";

type ScrollAxis = "horizontal" | "vertical";

export default function useScrollToEnd<T extends HTMLElement>({
  axis,
  enabled = true,
  scrollRef,
  updateKey,
}: {
  axis: ScrollAxis;
  enabled?: boolean;
  scrollRef: RefObject<T | null>;
  updateKey: string;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      if (axis === "horizontal") {
        scrollElement.scrollTo({
          left: scrollElement.scrollWidth,
          behavior: "smooth",
        });
        return;
      }

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [axis, enabled, scrollRef, updateKey]);
}
