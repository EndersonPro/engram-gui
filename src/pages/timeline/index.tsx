import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { TimelineIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { QueryState } from "@/components/ui/query-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMemories } from "@features/memories/api/use-memories";
import { getLastValidTimelineParamsForRetry, useTimeline } from "@features/timeline/api/use-timeline";
import { resolveTimelineObservationSelection, useTimelineUiStore } from "@features/timeline/model/timeline-ui-store";

const TimelinePage = () => {
  const selectedObservationId = useTimelineUiStore((s) => s.selectedObservationId);
  const limit = useTimelineUiStore((s) => s.limit);
  const setSelectedObservationId = useTimelineUiStore((s) => s.setSelectedObservationId);
  const setLimit = useTimelineUiStore((s) => s.setLimit);

  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const memoriesQuery = useMemories({ limit: 50 });
  const observations = memoriesQuery.data?.kind === "success" ? memoriesQuery.data.data ?? [] : [];

  const effectiveObservationId = resolveTimelineObservationSelection(
    selectedObservationId,
    observations.map((o) => ({ id: o.id, createdAt: o.createdAt })),
  );

  const timelineParams = useMemo(
    () => ({ observation_id: effectiveObservationId ?? 0, before: limit, after: limit }),
    [effectiveObservationId, limit],
  );

  const hasValidTarget = effectiveObservationId !== null;
  const { data, isLoading, isFetching, refetch } = useTimeline(timelineParams, { enabled: hasValidTarget });

  const timelineEntries = data?.kind === "success" ? data.data?.entries ?? [] : [];
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && timelineEntries.length === 0);

  const retryParams = getLastValidTimelineParamsForRetry() ?? (hasValidTarget ? timelineParams : null);

  const handleRetry = () => {
    if (retryParams) {
      setSelectedObservationId(retryParams.observation_id);
      setLimit(retryParams.after ?? retryParams.before ?? limit);
    }
    void refetch();
  };

  return (
    <section className="space-y-4">
      <>
        <CardHeader>
          <PageHeading icon={TimelineIcon} subtitle="Load before/after context from a selected observation with explicit live states." title="Observation timeline" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:items-end bg-[var(--surface-panel-elevated)] p-4 rounded-xl border border-[color:var(--chrome-edge-highlight)] shadow-sm">
            <label className="flex flex-col gap-1.5 flex-1 text-sm font-semibold text-[var(--text-primary)]" htmlFor="timeline-observation-select">
              Reference Observation
              <Select
                value={effectiveObservationId ? String(effectiveObservationId) : "empty"}
                onValueChange={(v) => {
                  setSelectedObservationId(v && v !== "empty" ? Number.parseInt(v, 10) : null);
                }}
              >
                <SelectTrigger id="timeline-observation-select" className="bg-[var(--surface-control)]">
                  <SelectValue placeholder="Select an observation context..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Select an observation context...</SelectItem>
                  {observations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>#{o.id} · {o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]" htmlFor="timeline-limit-input">
              Context Range
              <Input
                id="timeline-limit-input" 
                className="w-28 h-11 text-center bg-[var(--surface-control)]"
                type="number"
                min={1} 
                max={50}
                value={limit} 
                onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))} 
              />
            </label>
          </div>

          <Separator tone="soft" className="my-6" />

          {!hasValidTarget ? (
            <Alert>Select an observation to load timeline context. If none exist yet, create one from an active session.</Alert>
          ) : (
            <QueryState
              isLoading={isLoading || isFetching || memoriesQuery.isLoading}
              hasData={!!data}
              error={isErrorState ? { message: data.error.message, onRetry: handleRetry, retryLabel: retryParams ? `Retry #${retryParams.observation_id}` : "Retry" } : undefined}
              isEmpty={isEmptyState && !isErrorState}
              emptyMessage={`No timeline entries found for observation #${effectiveObservationId}.`}
              loadingLabel="Loading timeline"
            >
              {timelineEntries.length > 0 ? (
                <div>
                  <ScrollArea className="p-6">
                    <div className="relative pl-6 py-2 space-y-6 before:absolute before:inset-y-4 before:left-[11px] before:w-[2px] before:bg-[color:var(--chrome-edge-highlight)]">
                      {timelineEntries.map((entry) => (
                        <div key={entry.id} className="relative">
                          <div className={`absolute -left-[30px] top-4 h-3 w-3 rounded-full border-2 border-[var(--surface-panel)] shadow-[0_0_0_2px_var(--chrome-edge-highlight)] ${entry.isFocus ? 'bg-[var(--accent-solid)] w-4 h-4 -left-[32px] top-3.5' : 'bg-[var(--text-muted)]'}`} />
                          <div
                            onClick={() => setSelectedEntry(entry)}
                            className={`rounded-xl bg-[var(--surface-panel-elevated)]/90 px-4 py-3 shadow-[var(--shadow-soft)] border transition-colors hover:bg-[var(--surface-panel)] cursor-pointer ${entry.isFocus ? 'border-[var(--accent-solid)]/40 ring-1 ring-[var(--accent-solid)]/20' : 'border-[color:var(--chrome-edge-highlight)]'}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <p className="font-semibold text-sm text-[var(--text-strong)]">{entry.label}</p>
                              <span className="bg-[var(--surface-overlay)] text-[10px] text-[var(--text-muted)] tracking-wider mt-0.5 uppercase px-2 py-0.5 rounded-full border border-neutral-500/20 whitespace-nowrap">
                                {entry.type}
                              </span>
                            </div>
                            {entry.happenedAt && (
                              <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {new Date(entry.happenedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : null}
            </QueryState>
          )}

          {isErrorState ? (
            <Button className="mt-1" variant="secondary" onClick={handleRetry}>Retry timeline</Button>
          ) : null}
        </CardContent>
      </>

      <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={`Timeline Observation #${selectedEntry?.id || ""}`}>
        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-[var(--surface-overlay)] max-w-none text-[var(--text-primary)]">
          {selectedEntry && <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw as any]}>{selectedEntry.content}</ReactMarkdown>}
        </div>
      </Modal>
    </section>
  );
};

export default TimelinePage;
