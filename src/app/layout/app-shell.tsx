import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { deriveInspectorContext } from "@app/layout/inspector-context";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Memories", to: "/memories" },
  { label: "Search", to: "/search" },
  { label: "Timeline", to: "/timeline" },
  { label: "Context", to: "/context" },
  { label: "Settings", to: "/settings" },
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

      <div className="relative mx-auto grid w-full max-w-[1320px] gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <Sheet className="space-y-5" depth="rail">
          <div className="space-y-1">
            <p className="text-[var(--type-caption)] uppercase tracking-[0.12em] text-[var(--text-muted)]">Engram Desktop</p>
            <h1 className="text-[var(--type-heading)] leading-[var(--line-heading)]">Tahoe Liquid Glass</h1>
          </div>

          <nav aria-label="Primary" className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)]",
                    isActive && "bg-[var(--surface-control)] text-[var(--text-strong)]",
                  )
                }
                data-focus-ring="visible"
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </Sheet>

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
              <CardTitle>Inspector</CardTitle>
              <CardDescription>Route context stays shell-local and non-domain.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="default">{inspectorContext.route}</Badge>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Live data behavior is unchanged. Inspector only reflects current route context.
              </p>
              <Link className="mt-4 inline-flex text-sm text-[var(--text-secondary)] hover:text-[var(--text-strong)]" to="/settings">
                Open settings
              </Link>
            </CardContent>
          </Card>
        </Sheet>
      </div>
    </div>
  );
};
