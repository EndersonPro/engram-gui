import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <section
    className={cn(
      "rounded-2xl border border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-panel)]/80 bg-[image:var(--chrome-gradient-top)] p-4 shadow-[var(--shadow-soft)] [box-shadow:var(--panel-inner-shadow),var(--shadow-soft)] backdrop-blur-[var(--glass-blur-strong)]",
      className,
    )}
    data-tahoe-surface="elevated"
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)]", className)} {...props} />
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
