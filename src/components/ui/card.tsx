import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardTone = "panel" | "content";
type CardDensity = "comfortable" | "compact";

const toneClasses: Record<CardTone, string> = {
  panel: "bg-[var(--surface-panel)]/80",
  content: "bg-[var(--surface-panel-elevated)]/78",
};

const densityClasses: Record<CardDensity, string> = {
  comfortable: "p-4",
  compact: "p-3",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  density?: CardDensity;
}

export const Card = ({ className, tone = "panel", density = "comfortable", ...props }: CardProps) => (
  <section
    className={cn(
      "rounded-2xl border border-[color:var(--chrome-edge-highlight)] bg-[image:var(--chrome-gradient-top)] shadow-[var(--shadow-soft)] [box-shadow:var(--panel-inner-shadow),var(--shadow-soft)] backdrop-blur-[var(--glass-blur-strong)]",
      toneClasses[tone],
      densityClasses[density],
      className,
    )}
    data-tahoe-density={density}
    data-tahoe-surface="elevated"
    data-tahoe-tone={tone}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-[var(--type-title)] leading-[var(--line-title)] font-semibold tracking-[-0.01em] text-[var(--text-strong)]",
      className,
    )}
    {...props}
  />
);

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[var(--text-secondary)]", className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-3 space-y-3", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-4 flex flex-wrap items-center gap-2", className)} {...props} />
);
