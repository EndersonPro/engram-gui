import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SeparatorTone = "soft" | "strong";

const byTone: Record<SeparatorTone, string> = {
  soft: "bg-[color-mix(in_oklch,var(--text-muted)_18%,transparent)]",
  strong: "bg-[color-mix(in_oklch,var(--text-muted)_34%,transparent)]",
};

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SeparatorTone;
}

export const Separator = ({ className, tone = "soft", ...props }: SeparatorProps) => (
  <div className={cn("h-px w-full", byTone[tone], className)} data-tahoe-separator={tone} {...props} />
);
