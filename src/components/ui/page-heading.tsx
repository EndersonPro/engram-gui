import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { EmojiAccent } from "@/components/ui/emoji-accent";

export interface PageHeadingProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  accentSymbol?: string;
  accentLabel?: string;
}

export const PageHeading = ({ title, subtitle, badge, accentSymbol, accentLabel }: PageHeadingProps) => {
  return (
    <header className="space-y-2" data-page-heading="true">
      {badge ? <Badge>{badge}</Badge> : null}
      <h2 className="flex items-center gap-2 text-[var(--type-heading)] leading-[var(--line-heading)] text-[var(--text-strong)]">
        {accentSymbol ? <EmojiAccent decorative={false} label={accentLabel} symbol={accentSymbol} /> : null}
        <span>{title}</span>
      </h2>
      {subtitle ? <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
    </header>
  );
};
