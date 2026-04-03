import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const ScrollArea = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("max-h-[22rem] overflow-auto pr-1", className)} {...props} />
);
