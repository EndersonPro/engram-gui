import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContextIcon, DashboardIcon, MemoriesIcon, SearchIcon, TimelineIcon } from "@/components/ui/icons";
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
];

export const AppShell = () => {
  const location = useLocation();
  const inspectorContext = deriveInspectorContext(location.pathname);

  return (
    <div className="relative flex h-full flex-col px-5 py-4 text-[var(--text-primary)] md:px-6 md:py-5" data-shell-layer="canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1320px] flex-col gap-3">
        <Sheet className="" depth="rail">
          <nav aria-label="Primary" className="overflow-x-auto">
            <ul className="flex w-full flex-row justify-center items-center gap-1.5 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.to} className="shrink-0">
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all",
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

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <main
            aria-live="polite"
            className="min-h-0 min-w-0 overflow-y-auto rounded-3xl border border-[color:var(--chrome-edge-highlight)] bg-[var(--surface-panel)]/82 bg-[image:var(--chrome-gradient-top)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[var(--glass-blur-strong)] transition-[transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease)] motion-reduce:transition-none md:p-7"
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
                <Link className="mt-4 inline-flex text-sm font-medium text-[var(--accent-solid)] hover:text-[var(--accent-solid-hover)]" to="/">
                  Open dashboard
                </Link>
              </CardContent>
            </Card>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
