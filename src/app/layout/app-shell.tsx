import type { SVGProps } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionMenu } from "@/components/ui/section-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { deriveInspectorContext } from "@app/layout/inspector-context";

const navItems = [
  { label: "Dashboard", icon: DashboardIcon, to: "/" },
  { label: "Memories", icon: MemoriesIcon, to: "/memories" },
  { label: "Search", icon: SearchIcon, to: "/search" },
  { label: "Timeline", icon: TimelineIcon, to: "/timeline" },
  { label: "Context", icon: ContextIcon, to: "/context" },
  { label: "Settings", icon: SettingsIcon, to: "/settings" },
];

export const AppShell = () => {
  const location = useLocation();
  const inspectorContext = deriveInspectorContext(location.pathname);

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-5 text-[var(--text-primary)] md:px-7 md:py-7" data-shell-layer="canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_-18%,color-mix(in_oklch,white_58%,var(--surface-overlay)),transparent_50%),radial-gradient(circle_at_92%_0%,color-mix(in_oklch,var(--accent-solid)_18%,transparent),transparent_48%)]"
      />

      <div className="relative mx-auto w-full max-w-[1320px] space-y-4">
        <Sheet className="space-y-4" depth="rail">
          <nav aria-label="Primary" className="overflow-x-auto pb-1">
            <ul className="flex w-full min-w-[720px] flex-row items-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.to} className="min-w-0 flex-1">
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors",
                          "hover:border-[color:var(--chrome-edge-highlight)] hover:text-[var(--text-strong)]",
                          isActive &&
                            "border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-control)] text-[var(--text-strong)]",
                        )
                      }
                      data-focus-ring="visible"
                      to={item.to}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Sheet>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <main
            aria-live="polite"
            className="min-w-0 rounded-3xl border border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-panel)]/82 bg-[image:var(--chrome-gradient-top)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[var(--glass-blur-strong)] transition-[transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease)] motion-reduce:transition-none md:p-7"
            data-shell-layer="chrome"
            data-shell-motion="reduce-safe"
          >
            <Outlet />
          </main>

          <Sheet className="hidden xl:block" depth="panel">
            <Card className="bg-[var(--surface-overlay)]/80">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-1.5">
                  <span>Inspector</span>
                </CardTitle>
                <CardDescription>Route context stays shell-local and non-domain.</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="default">{inspectorContext.route}</Badge>
                <Separator className="mt-3" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Live data behavior is unchanged. Inspector only reflects current route context.
                </p>
                <SectionMenu
                  ariaLabel="Inspector actions"
                  items={[
                    { key: "route", label: "Current route", variant: "ghost", iconLeading: true, buttonProps: { disabled: true } },
                  ]}
                />
                <Link className="mt-4 inline-flex text-sm text-[var(--text-secondary)] hover:text-[var(--text-strong)]" to="/settings">
                  Open settings
                </Link>
              </CardContent>
            </Card>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

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

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect height="7" rx="1" width="7" x="3" y="3" />
      <rect height="11" rx="1" width="7" x="14" y="3" />
      <rect height="11" rx="1" width="7" x="3" y="10" />
      <rect height="7" rx="1" width="7" x="14" y="14" />
    </IconBase>
  );
}

function MemoriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 21c4.5 0 8-3.1 8-7.4 0-2.1-.8-4-2.1-5.3-.3-3.2-2.7-5.3-5.9-5.3s-5.6 2.1-5.9 5.3C4.8 9.6 4 11.5 4 13.6 4 17.9 7.5 21 12 21Z" />
      <path d="M9.5 11.5h.01M14.5 11.5h.01M9.8 15.3c.6.5 1.4.7 2.2.7s1.6-.2 2.2-.7" />
    </IconBase>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </IconBase>
  );
}

function TimelineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

function ContextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M8 6h9a3 3 0 0 1 3 3v9" />
      <path d="M16 18H7a3 3 0 0 1-3-3V6" />
      <path d="M10 10h7M10 14h4" />
    </IconBase>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-1.8-1l-.3-2.6h-4l-.3 2.6a7.3 7.3 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 1.8 1l.3 2.6h4l.3-2.6a7.3 7.3 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </IconBase>
  );
}
