import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "default" | "danger" | "warning";

const byVariant: Record<AlertVariant, string> = {
  default: "bg-[var(--surface-panel-elevated)] text-[var(--text-primary)]",
  danger: "bg-[color-mix(in_oklch,var(--status-danger)_20%,var(--surface-panel-elevated))] text-[var(--text-strong)]",
  warning: "bg-[color-mix(in_oklch,var(--status-warning)_20%,var(--surface-panel-elevated))] text-[var(--text-strong)]",
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = ({ className, variant = "default", ...props }: AlertProps) => (
  <div className={cn("rounded-xl px-3 py-3 text-sm", byVariant[variant], className)} role="alert" {...props} />
);
