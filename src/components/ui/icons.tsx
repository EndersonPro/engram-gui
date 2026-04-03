import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

function IconBase({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn("size-4", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect height="7" rx="1" width="7" x="3" y="3" />
      <rect height="11" rx="1" width="7" x="14" y="3" />
      <rect height="11" rx="1" width="7" x="3" y="10" />
      <rect height="7" rx="1" width="7" x="14" y="14" />
    </IconBase>
  );
}

export function MemoriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v1a6 6 0 0 0 4 5.66V17a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-1.34A6 6 0 0 0 20 10V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
      <path d="M10 13h.01M14 13h.01" />
    </IconBase>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </IconBase>
  );
}

export function TimelineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function ContextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h4" />
    </IconBase>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-1.8-1l-.3-2.6h-4l-.3 2.6a7.3 7.3 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 1.8 1l.3 2.6h4l.3-2.6a7.3 7.3 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </IconBase>
  );
}
