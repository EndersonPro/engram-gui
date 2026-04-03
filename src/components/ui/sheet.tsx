import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SheetProps extends HTMLAttributes<HTMLElement> {
  depth?: "rail" | "panel";
}

const depthClasses: Record<NonNullable<SheetProps["depth"]>, string> = {
  rail: "bg-[var(--surface-overlay)]/88 backdrop-blur-[var(--glass-blur-xl)]",
  panel: "bg-[var(--surface-panel-elevated)]/84 backdrop-blur-[var(--glass-blur-strong)]",
};

export const Sheet = ({ className, depth = "panel", ...props }: SheetProps) => (
  <aside
    className={cn(
      "rounded-2xl border border-[color:var(--chrome-edge-highlight)] bg-[image:var(--chrome-gradient-top)] p-4 shadow-[var(--shadow-float)] [box-shadow:var(--panel-inner-shadow),var(--shadow-float)]",
      depthClasses[depth],
      className,
    )}
    data-tahoe-depth={depth}
    {...props}
  />
);
