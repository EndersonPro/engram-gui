import { useMemo } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemories } from "@features/memories/api/use-memories";
import { getLastValidTimelineParamsForRetry, useTimeline } from "@features/timeline/api/use-timeline";
import {
  resolveTimelineObservationSelection,
  useTimelineUiStore,
} from "@features/timeline/model/timeline-ui-store";

const TimelinePage = () => {
  const selectedObservationId = useTimelineUiStore((state) => state.selectedObservationId);
  const limit = useTimelineUiStore((state) => state.limit);
  const setSelectedObservationId = useTimelineUiStore((state) => state.setSelectedObservationId);
  const setLimit = useTimelineUiStore((state) => state.setLimit);

  const memoriesQuery = useMemories({ limit: 50 });
  const observations = memoriesQuery.data?.kind === "success" ? memoriesQuery.data.data ?? [] : [];

  const effectiveObservationId = resolveTimelineObservationSelection(
    selectedObservationId,
    observations.map((observation) => ({ id: observation.id, createdAt: observation.createdAt })),
  );

  const timelineParams = useMemo(
    () => ({
      observation_id: effectiveObservationId ?? 0,
      before: limit,
      after: limit,
    }),
    [effectiveObservationId, limit],
  );

  const hasValidTarget = effectiveObservationId !== null;
  const { data, isLoading, isFetching, refetch } = useTimeline(timelineParams, { enabled: hasValidTarget });

  const timelineEntries = data?.kind === "success" ? data.data?.entries ?? [] : [];
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && timelineEntries.length === 0);

  const retryParams = getLastValidTimelineParamsForRetry() ?? (hasValidTarget ? timelineParams : null);
  const retryLabel = retryParams
    ? `Retry timeline (#${retryParams.observation_id}, limit ${retryParams.after})`
    : "Retry timeline";

  const handleRetry = () => {
    if (retryParams) {
      setSelectedObservationId(retryParams.observation_id);
      setLimit(retryParams.after ?? retryParams.before ?? limit);
    }

    void refetch();
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--type-heading)] leading-[var(--line-heading)]">Observation timeline</CardTitle>
          <CardDescription>Load before/after context from a selected observation with explicit live states.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="timeline-observation-select">
              Observation
              <Select
                id="timeline-observation-select"
                value={effectiveObservationId ? String(effectiveObservationId) : ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedObservationId(nextValue ? Number.parseInt(nextValue, 10) : null);
                }}
              >
                <option value="">Select an observation</option>
                {observations.map((observation) => (
                  <option key={observation.id} value={observation.id}>
                    #{observation.id} · {observation.title}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="timeline-limit-input">
              Range
              <Input
                id="timeline-limit-input"
                className="w-28"
                type="number"
                min={1}
                value={limit}
                onChange={(event) => setLimit(Number.parseInt(event.target.value, 10))}
              />
            </label>
          </div>

          {!hasValidTarget ? (
            <Alert>
              Select an observation to load timeline context. If none exist yet, create one from an active
              session.
            </Alert>
          ) : null}

          {(isLoading || isFetching || memoriesQuery.isLoading) && hasValidTarget ? (
            <div className="space-y-2" aria-label="Loading timeline">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isErrorState ? (
            <Alert variant="danger">
              <p>Timeline failed: {data.error.message}</p>
              <div className="mt-2">
                <Button variant="destructive" onClick={handleRetry}>
                  {retryLabel}
                </Button>
              </div>
            </Alert>
          ) : null}

          {isEmptyState && !isErrorState && hasValidTarget && !(isLoading || isFetching) ? (
            <Alert>No timeline entries found for observation #{effectiveObservationId}.</Alert>
          ) : null}

          {timelineEntries.length > 0 && !isErrorState ? (
            <ScrollArea>
              <ul className="space-y-2 text-sm text-[var(--text-primary)]" data-divider="none" data-separation="spacing-tonal">
                {timelineEntries.map((entry) => (
                  <li key={entry.id} className="rounded-xl bg-[var(--surface-panel-elevated)]/80 px-3 py-2" data-item-separator="none">
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-[var(--type-caption)] text-[var(--text-muted)]">{entry.happenedAt}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : null}

          {isErrorState ? (
            <Button className="mt-1" variant="secondary" onClick={handleRetry}>
              Retry timeline
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};

export default TimelinePage;
