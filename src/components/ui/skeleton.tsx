import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "animate-pulse rounded-xl bg-[color-mix(in_oklch,var(--surface-control)_70%,white)]",
      className,
    )}
    {...props}
  />
);
