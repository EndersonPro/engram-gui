import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";

type SectionMenuVariant = "primary" | "secondary" | "ghost" | "destructive";

export interface SectionMenuItem {
  key: string;
  label: string;
  variant?: SectionMenuVariant;
  iconLeading?: boolean;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;
}

export interface SectionMenuProps {
  items: SectionMenuItem[];
  ariaLabel?: string;
}

export const SectionMenu = ({ items, ariaLabel = "Section menu" }: SectionMenuProps) => {
  return (
    <div aria-label={ariaLabel} className="flex flex-wrap items-center gap-2" role="group">
      {items.map((item) => (
        <Button
          key={item.key}
          iconLeading={item.iconLeading}
          variant={item.variant ?? "secondary"}
          {...item.buttonProps}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
};
