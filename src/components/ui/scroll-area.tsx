import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type OverflowElement = Pick<HTMLElement, "scrollHeight" | "clientHeight" | "scrollWidth" | "clientWidth">;

export const isElementOverflowing = (element: OverflowElement): boolean =>
  element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;

export const ScrollArea = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateOverflowState = () => {
      setHasOverflow(isElementOverflowing(element));
    };

    updateOverflowState();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOverflowState) : null;
    resizeObserver?.observe(element);

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            updateOverflowState();
          })
        : null;

    mutationObserver?.observe(element, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={cn("max-h-[22rem] pr-1", hasOverflow ? "overflow-auto" : "overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
};
