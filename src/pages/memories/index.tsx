import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { MemoriesIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { QueryState } from "@/components/ui/query-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMemories } from "@features/memories/api/use-memories";

const MemoriesPage = () => {
  const [projectFilter, setProjectFilter] = useState<string>("");
  const { data, isLoading, isFetching, refetch } = useMemories({ project: projectFilter || undefined, limit: 20 });
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  const observations = data?.kind === "success" ? data.data ?? [] : [];
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && observations.length === 0);

  return (
    <section className="space-y-4">
      <>
        <CardHeader className="flex flex-row items-center justify-between">
          <PageHeading icon={MemoriesIcon} subtitle="Latest observations from live endpoint data." title="Recent memories" />
          <div className="w-64">
            <Input
              placeholder="Filter by project..."
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full bg-[var(--surface-overlay)]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Separator tone="soft" />
          <QueryState
            isLoading={isLoading || isFetching}
            hasData={!!data}
            error={isErrorState ? { message: data.error.message, onRetry: () => void refetch(), retryLabel: "Retry memories" } : undefined}
            isEmpty={isEmptyState}
            emptyMessage="No memories available yet. Start a session to capture observations."
            loadingLabel="Loading memories"
          >
            {observations.length > 0 ? (
              <ScrollArea>
                <ul className="space-y-3 text-sm text-[var(--text-primary)]" data-divider="none" data-separation="spacing-tonal">
                  {observations.map((observation) => (
                    <li key={observation.id} className="flex flex-col gap-2 rounded-xl bg-[var(--surface-panel-elevated)]/80 p-4" data-item-separator="none">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-400 border border-blue-500/20 shadow-sm">
                            {observation.project ?? "No project"}
                          </span>
                          {observation.scope && (
                            <span className="rounded-md bg-[var(--surface-overlay)] px-2 py-1 text-[var(--text-secondary)] border border-[color:var(--chrome-edge-highlight)] shadow-sm">
                              {observation.scope}
                            </span>
                          )}
                          <span className="text-[var(--text-muted)] font-medium bg-[var(--surface-overlay)] px-2 py-1 rounded-md border border-[color:var(--chrome-edge-highlight)]">
                            {new Date(observation.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setSelectedMemory(observation.content)}>
                          View Details
                        </Button>
                      </div>
                      <p className="font-medium line-clamp-3 overflow-hidden text-ellipsis whitespace-pre-wrap">{observation.content}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : null}
          </QueryState>
        </CardContent>
      </>

      <Modal isOpen={!!selectedMemory} onClose={() => setSelectedMemory(null)} title="Observation Details">
        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-[var(--surface-overlay)] max-w-none text-[var(--text-primary)]">
          {selectedMemory && <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw as any]}>{selectedMemory}</ReactMarkdown>}
        </div>
      </Modal>
    </section>
  );
};

export default MemoriesPage;
