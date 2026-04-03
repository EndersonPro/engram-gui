import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const byVariant: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-solid)] text-[var(--text-strong)] shadow-[var(--shadow-soft)] hover:bg-[var(--accent-solid-hover)] active:translate-y-px active:opacity-95",
  secondary:
    "border border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-control)]/95 text-[var(--text-primary)] hover:bg-[var(--surface-control-hover)] active:translate-y-px active:bg-[var(--surface-control)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-control)]/80 hover:text-[var(--text-strong)] active:bg-[var(--surface-control)]",
  destructive: "bg-[var(--status-danger)] text-white hover:opacity-95 active:translate-y-px active:opacity-90",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = ({ className, variant = "primary", type = "button", ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-[background-color,opacity] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50",
        byVariant[variant],
        className,
      )}
      data-focus-ring="visible"
      data-tahoe-contrast="strong"
      type={type}
      {...props}
    />
  );
};
