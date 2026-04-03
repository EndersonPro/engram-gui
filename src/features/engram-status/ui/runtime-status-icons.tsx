import type { SVGProps } from "react";

type RuntimeIconProps = SVGProps<SVGSVGElement>;

const baseProps: RuntimeIconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const CheckCircleIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.2 2.2 4.8-4.8" />
  </svg>
);

export const XCircleIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6" />
    <path d="m15 9-6 6" />
  </svg>
);

export const PlayIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M9 7.5v9l7-4.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const StopIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="8" y="8" width="8" height="8" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const RestartIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M20 11a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v7h-7" />
  </svg>
);

export const RefreshIcon = (props: RuntimeIconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 12a9 9 0 0 1-15.3 6.4" />
    <path d="M3 12A9 9 0 0 1 18.3 5.6" />
    <path d="M6 19H3v-3" />
    <path d="M18 5h3v3" />
  </svg>
);
