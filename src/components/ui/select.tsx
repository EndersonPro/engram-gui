import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl bg-[var(--surface-control)] px-3 text-sm text-[var(--text-primary)] transition-[background-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        className,
      )}
      {...props}
    />
  );
};
