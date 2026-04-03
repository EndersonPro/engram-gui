import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { RuntimeStatusPanel } from "@features/engram-status/ui/runtime-status-panel";

const DashboardPage = () => {
  return (
    <section
      className="space-y-5 transition-[transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease)] motion-reduce:transition-none"
      data-dashboard-motion="reduce-safe"
    >
      <Card>
        <CardHeader>
          <Badge>Dashboard</Badge>
          <CardTitle className="text-[var(--type-display)] leading-[var(--line-display)]">Runtime command center</CardTitle>
          <CardDescription>
            Runtime status and lifecycle controls are wired with health-only contracts.
          </CardDescription>
        </CardHeader>
      </Card>

      <Sheet depth="panel">
        <CardHeader>
          <CardTitle>Status overview</CardTitle>
          <CardDescription>Live runtime status remains query-driven and behavior-compatible.</CardDescription>
        </CardHeader>
        <CardContent>
          <RuntimeStatusPanel />
        </CardContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>Runtime controls</CardTitle>
          <CardDescription>
            Start, stop, restart, and refresh actions keep the same command wiring with Tahoe presentation only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="default">Start</Badge>
          <Badge variant="default">Stop</Badge>
          <Badge variant="default">Restart</Badge>
          <Badge variant="default">Refresh status</Badge>
        </CardContent>
      </Card>
    </section>
  );
};

export default DashboardPage;
