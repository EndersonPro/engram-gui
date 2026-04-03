import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { QueryState } from "@/components/ui/query-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getLastValidSearchParamsForRetry, useSearch } from "@features/search/api/use-search";
import { useSearchUiStore } from "@features/search/model/search-ui-store";

const SEARCH_DEBOUNCE_MS = 300;

const SearchPage = () => {
  const draftQuery = useSearchUiStore((s) => s.draftQuery);
  const limit = useSearchUiStore((s) => s.limit);
  const setDraftQuery = useSearchUiStore((s) => s.setDraftQuery);
  const setLimit = useSearchUiStore((s) => s.setLimit);
  const trimmedQuery = useSearchUiStore((s) => s.trimmedQuery());

  const [submittedQuery, setSubmittedQuery] = useState(trimmedQuery);
  const [selectedSearchItem, setSelectedSearchItem] = useState<{ id: string; snippet: string } | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setSubmittedQuery(trimmedQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [trimmedQuery]);

  const activeParams = useMemo(() => ({ q: submittedQuery, limit, project: undefined, scope: undefined }), [submittedQuery, limit]);
  const isSearchEnabled = activeParams.q.length > 0;
  const { data, isLoading, refetch, isFetching } = useSearch(activeParams, { enabled: isSearchEnabled });

  const isErrorState = data?.kind === "retryable_failure";
  const items = data?.kind === "success" ? data.data?.items ?? [] : [];
  const isEmptyResults = data?.kind === "empty" || (data?.kind === "success" && items.length === 0);

  const retryParams = getLastValidSearchParamsForRetry() ?? (isSearchEnabled ? activeParams : null);

  const handleRetry = () => {
    if (retryParams) {
      setDraftQuery(retryParams.q);
      setLimit(retryParams.limit ?? 20);
      setSubmittedQuery(retryParams.q);
    }
    void refetch();
  };

  return (
    <section className="space-y-4">
      <>
        <CardHeader>
          <PageHeading icon={SearchIcon} subtitle="Use live Engram search with explicit loading, empty, error, and data states." title="Search memories" />
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end"
            onSubmit={(e) => { e.preventDefault(); setSubmittedQuery(trimmedQuery); }}
          >
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="search-query-input">
              Query
              <Input id="search-query-input" value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Search observations" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="search-limit-input">
              Limit
              <Input id="search-limit-input" className="w-28" type="number" min={1} value={limit} onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))} />
            </label>
            <Button type="submit">Search</Button>
          </form>

          {!activeParams.q ? <Alert>Enter a query to search memories. We only run live search when the query is non-empty.</Alert> : null}

          <Separator tone="soft" />

          <QueryState
            isLoading={(isLoading || isFetching) && isSearchEnabled}
            hasData={!!data || !isSearchEnabled}
            error={isErrorState ? { message: data.error.message, onRetry: handleRetry, retryLabel: retryParams ? `Retry "${retryParams.q}"` : "Retry" } : undefined}
            isEmpty={isEmptyResults && !isErrorState && isSearchEnabled && !(isLoading || isFetching)}
            emptyMessage={`No results found for "${activeParams.q}". Try a broader query or increase limit.`}
            loadingLabel="Searching memories"
          >
            {items.length > 0 ? (
              <ScrollArea>
                <ul className="space-y-2 text-sm text-[var(--text-primary)]">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl bg-[var(--surface-panel-elevated)]/80 p-3 flex justify-between items-start gap-4 border border-[color:var(--chrome-edge-highlight)] hover:bg-[var(--surface-panel)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="bg-[var(--accent-solid)]/10 text-[var(--accent-solid)] border border-[var(--accent-solid)]/20 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold mb-2 inline-block">
                          OBSERVATION #{item.id}
                        </span>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic border-l-2 pl-3 border-[var(--chrome-edge-highlight)] line-clamp-2 overflow-hidden text-ellipsis">
                          "{item.snippet}..."
                        </p>
                      </div>
                      <Button variant="secondary" className="px-2 py-1 text-xs shrink-0" onClick={() => setSelectedSearchItem(item)}>
                        View Details
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : null}
          </QueryState>
        </CardContent>
      </>

      <Modal isOpen={!!selectedSearchItem} onClose={() => setSelectedSearchItem(null)} title={`Observation Details #${selectedSearchItem?.id || ""}`}>
        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-[var(--surface-overlay)] max-w-none text-[var(--text-primary)]">
          {selectedSearchItem && <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw as any]}>{selectedSearchItem.snippet}</ReactMarkdown>}
        </div>
      </Modal>
    </section>
  );
};

export default SearchPage;
