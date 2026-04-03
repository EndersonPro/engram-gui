import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger";

const byVariant: Record<BadgeVariant, string> = {
  default:
    "border border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-control)]/95 text-[var(--text-secondary)]",
  success:
    "border border-[color:var(--chrome-edge-highlight)] bg-[color-mix(in_oklch,var(--status-success)_28%,var(--surface-control))] text-[var(--text-strong)]",
  warning:
    "border border-[color:var(--chrome-edge-highlight)] bg-[color-mix(in_oklch,var(--status-warning)_28%,var(--surface-control))] text-[var(--text-strong)]",
  danger:
    "border border-[color:var(--chrome-edge-highlight)] bg-[color-mix(in_oklch,var(--status-danger)_28%,var(--surface-control))] text-[var(--text-strong)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-[var(--shadow-soft)]",
        byVariant[variant],
        className,
      )}
      data-tahoe-contrast="strong"
      {...props}
    />
  );
};
