import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createSettingsQueryOptions, useSettings } from "@features/settings/api/use-settings";

const SettingsPage = () => {
  const { data, isLoading, isFetching, refetch } = useSettings({ profile: "default" });
  const queryKey = createSettingsQueryOptions({ profile: "default" }).queryKey;

  const settings = data?.kind === "success" ? data.data : null;
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty";
  const hasIssues = (settings?.issues.length ?? 0) > 0;

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--type-heading)] leading-[var(--line-heading)]">Runtime settings overview</CardTitle>
          <CardDescription>Composite live settings from sync status, stats, and local runtime config.</CardDescription>
          <p className="text-[var(--type-caption)] text-[var(--text-muted)]">Query key: {queryKey.join("/")}</p>
        </CardHeader>
        <CardContent>
          {(isLoading || isFetching) && !data ? (
            <div className="space-y-2" aria-label="Loading settings overview">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isErrorState ? (
            <Alert variant="danger">
              <p>Unable to load settings overview: {data.error.message}</p>
              <div className="mt-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Retry settings
                </Button>
              </div>
            </Alert>
          ) : null}

          {isEmptyState ? <Alert>No settings overview data available yet.</Alert> : null}

          {hasIssues ? (
            <Alert variant="warning" role="status">
              <p className="font-medium">Some settings sources are currently unavailable</p>
              <ul className="mt-1 space-y-1 pl-4">
                {settings?.issues.map((issue) => (
                  <li key={`${issue.source}-${issue.message}`}>
                    {issue.source}: {issue.message}
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}

          {settings ? (
            <div className="space-y-2 rounded-xl bg-[var(--surface-panel-elevated)]/80 px-3 py-3 text-sm text-[var(--text-primary)]">
              {settings.sync ? <p>Sync: {settings.sync.enabled ? "enabled" : "disabled"}</p> : <p>Sync: unavailable</p>}
              {settings.stats ? (
                <p>
                  Stats: {settings.stats.totalSessions} sessions · {settings.stats.totalObservations} observations ·{" "}
                  {settings.stats.totalPrompts} prompts
                </p>
              ) : (
                <p>Stats: unavailable</p>
              )}
              {settings.config ? <p>Configured API base URL: {settings.config.apiBaseUrl}</p> : <p>Runtime config: unavailable</p>}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};

export default SettingsPage;
