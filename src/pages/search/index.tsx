import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getLastValidSearchParamsForRetry, useSearch } from "@features/search/api/use-search";
import { useSearchUiStore } from "@features/search/model/search-ui-store";

const SEARCH_DEBOUNCE_MS = 300;

const SearchPage = () => {
  const draftQuery = useSearchUiStore((state) => state.draftQuery);
  const limit = useSearchUiStore((state) => state.limit);
  const setDraftQuery = useSearchUiStore((state) => state.setDraftQuery);
  const setLimit = useSearchUiStore((state) => state.setLimit);
  const trimmedQuery = useSearchUiStore((state) => state.trimmedQuery());

  const [submittedQuery, setSubmittedQuery] = useState(trimmedQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSubmittedQuery(trimmedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  const activeParams = useMemo(
    () => ({
      q: submittedQuery,
      limit,
      project: undefined,
      scope: undefined,
    }),
    [submittedQuery, limit],
  );

  const isSearchEnabled = activeParams.q.length > 0;
  const { data, isLoading, refetch, isFetching } = useSearch(activeParams, { enabled: isSearchEnabled });

  const isGuidanceState = !activeParams.q;
  const isErrorState = data?.kind === "retryable_failure";
  const items = data?.kind === "success" ? data.data?.items ?? [] : [];
  const isEmptyResultsState = data?.kind === "empty" || (data?.kind === "success" && items.length === 0);

  const retryParams = getLastValidSearchParamsForRetry() ?? (isSearchEnabled ? activeParams : null);
  const retryLabel = retryParams
    ? `Retry last search (\"${retryParams.q}\", limit ${retryParams.limit ?? 20})`
    : "Retry last search";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--type-heading)] leading-[var(--line-heading)]">Search memories</CardTitle>
          <CardDescription>Use live Engram search with explicit loading, empty, error, and data states.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedQuery(trimmedQuery);
            }}
          >
            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="search-query-input">
              Query
              <Input
                id="search-query-input"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Search observations"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]" htmlFor="search-limit-input">
              Limit
              <Input
                id="search-limit-input"
                className="w-28"
                type="number"
                min={1}
                value={limit}
                onChange={(event) => setLimit(Number.parseInt(event.target.value, 10))}
              />
            </label>

            <Button type="submit">Search</Button>
          </form>

          {isGuidanceState ? (
            <Alert>Enter a query to search memories. We only run live search when the query is non-empty.</Alert>
          ) : null}

          {(isLoading || isFetching) && !isGuidanceState ? (
            <div className="space-y-2" aria-label="Searching memories">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isErrorState ? (
            <Alert variant="danger">
              <p>Search failed: {data.error.message}</p>
              <div className="mt-2">
                <Button variant="destructive" onClick={handleRetry}>
                  {retryLabel}
                </Button>
              </div>
            </Alert>
          ) : null}

          {isEmptyResultsState && !isErrorState && !isGuidanceState && !(isLoading || isFetching) ? (
            <Alert>No results found for “{activeParams.q}”. Try a broader query or increase limit.</Alert>
          ) : null}

          {items.length > 0 && !isErrorState ? (
            <ScrollArea>
              <ul className="space-y-2 text-sm text-[var(--text-primary)]">
                {items.map((item) => (
                  <li key={item.id} className="rounded-xl bg-[var(--surface-panel-elevated)]/80 px-3 py-2">
                    <p className="font-medium">{item.id}</p>
                    <p className="text-[var(--type-caption)] text-[var(--text-muted)]">{item.snippet}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : null}
        </CardContent>
      </Card>

    </section>
  );
};

export default SearchPage;
