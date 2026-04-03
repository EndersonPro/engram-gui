import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_FALLBACK = "•";

export interface EmojiAccentProps extends HTMLAttributes<HTMLSpanElement> {
  symbol: string;
  fallback?: string;
  label?: string;
  decorative?: boolean;
}

export const EmojiAccent = ({
  className,
  symbol,
  fallback = DEFAULT_FALLBACK,
  label,
  decorative = true,
  ...props
}: EmojiAccentProps) => {
  const displaySymbol = symbol.trim().length > 0 ? symbol : fallback;

  return (
    <>
      <span aria-hidden="true" className={cn("inline-flex leading-none", className)} data-emoji-accent="decorative" {...props}>
        {displaySymbol}
      </span>
      {!decorative && label ? <span className="sr-only">{label}</span> : null}
    </>
  );
};
