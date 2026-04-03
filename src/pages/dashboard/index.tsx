import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { DashboardIcon } from "@/components/ui/icons";
import { PageHeading } from "@/components/ui/page-heading";
import { QueryState } from "@/components/ui/query-state";
import { RuntimeStatusPanel } from "@features/engram-status/ui/runtime-status-panel";
import { useSettings } from "@features/settings/api/use-settings";

const DashboardPage = () => {
  const { data, isLoading, isFetching, refetch } = useSettings({ profile: "default" });

  const settings = data?.kind === "success" ? data.data : null;
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty";
  const hasIssues = (settings?.issues.length ?? 0) > 0;

  return (
    <section
      className="space-y-8 transition-[transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease)] motion-reduce:transition-none"
      data-dashboard-motion="reduce-safe"
    >

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Engine Controls */}

        <div className="flex flex-col gap-3">
          <PageHeading icon={DashboardIcon} subtitle="System overview, runtime lifecycle, and synchronization status." title="Dashboard" />

          <h2 className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase pl-1">Engine Controls</h2>
          <RuntimeStatusPanel />
        </div>

        {/* Right Column: Settings & Database Metrics */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase pl-1">System Intelligence</h2>
          <Card className="p-4 h-full">
            <QueryState
              isLoading={isLoading || isFetching}
              hasData={!!data}
              error={isErrorState ? { message: data.error.message, onRetry: () => void refetch(), retryLabel: "Retry metrics" } : undefined}
              isEmpty={isEmptyState}
              emptyMessage="No system metrics available yet."
              loadingLabel="Loading metrics"
            >
              {hasIssues && (
                <Alert variant="warning" role="status" className="mb-6">
                  <p className="font-medium">Some settings sources are currently unavailable</p>
                  <ul className="mt-1 space-y-1 pl-4">
                    {settings?.issues.map((issue) => (
                      <li key={`${issue.source}-${issue.message}`}>
                        {issue.source}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              {settings && (
                <div className="grid grid-cols-1 gap-3">
                  {/* Sync Status Redesigned */}
                  <div className="rounded-xl bg-[var(--surface-overlay)] border border-[color:var(--chrome-edge-highlight)] p-3 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Platform Sync</p>
                      {settings.sync?.enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Actively Syncing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          Local Mode Only
                        </span>
                      )}
                    </div>
                    {settings.sync?.enabled && settings.sync.last_sync_at && (
                      <p className="text-[10px] text-[var(--text-muted)]">Last: {new Date(settings.sync.last_sync_at).toLocaleTimeString()}</p>
                    )}
                  </div>

                  {/* Core Statistics Redesigned */}
                  <div className="rounded-xl bg-[var(--surface-overlay)] border border-[color:var(--chrome-edge-highlight)] p-3 shadow-sm">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Memory Bank</p>
                    {settings.stats ? (
                      <div className="flex justify-between items-center text-xs">
                        <div className="px-2 py-1 rounded bg-[var(--surface-control)] border border-[var(--chrome-edge-highlight)]">
                          <span className="text-[var(--text-secondary)] mr-2">Sessions</span>
                          <span className="font-bold text-[var(--text-strong)]">{settings.stats.totalSessions}</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[var(--surface-control)] border border-[var(--chrome-edge-highlight)]">
                          <span className="text-[var(--text-secondary)] mr-2">Obs.</span>
                          <span className="font-bold text-[var(--text-strong)]">{settings.stats.totalObservations}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-xs text-[var(--text-muted)]">Metrics Offline</p>
                    )}
                  </div>

                  {/* Configuration Status Redesigned */}
                  <div className="rounded-xl bg-[var(--surface-panel-elevated)] border border-[color:var(--chrome-edge-highlight)] p-2 px-3 shadow-sm flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">API Config</p>
                    <p className="font-mono text-[10px] text-[var(--accent-solid)] truncate px-1 max-w-[200px]">
                      {settings.config?.apiBaseUrl || "Missing Binding"}
                    </p>
                  </div>
                </div>
              )}
            </QueryState>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
