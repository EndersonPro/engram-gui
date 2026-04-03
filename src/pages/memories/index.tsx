import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { createMemoriesQueryOptions, useMemories } from "@features/memories/api/use-memories";

const MemoriesPage = () => {
  const { data, isLoading, isFetching, refetch } = useMemories();
  const queryKey = createMemoriesQueryOptions().queryKey;

  const observations = data?.kind === "success" ? data.data ?? [] : [];
  const hasObservations = observations.length > 0;
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && observations.length === 0);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--type-heading)] leading-[var(--line-heading)]">Recent memories</CardTitle>
          <CardDescription>Latest observations from live endpoint data.</CardDescription>
          <p className="text-[var(--type-caption)] text-[var(--text-muted)]">Query key: {queryKey.join("/")}</p>
        </CardHeader>
        <CardContent>
          {(isLoading || isFetching) && !data ? (
            <div className="space-y-2" aria-label="Loading memories">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isErrorState ? (
            <Alert variant="danger">
              <p>Unable to load memories: {data.error.message}</p>
              <div className="mt-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Retry memories
                </Button>
              </div>
            </Alert>
          ) : null}

          {isEmptyState ? <Alert>No memories available yet. Start a session to capture observations.</Alert> : null}

          {hasObservations ? (
            <ScrollArea>
              <ul className="space-y-2 text-sm text-[var(--text-primary)]" data-divider="none" data-separation="spacing-tonal">
                {observations.map((observation) => (
                  <li
                    key={observation.id}
                    className="rounded-xl bg-[var(--surface-panel-elevated)]/80 px-3 py-2"
                    data-item-separator="none"
                  >
                    <p className="font-medium">{observation.content}</p>
                    <p className="text-[var(--type-caption)] text-[var(--text-muted)]">
                      {observation.project}/{observation.scope} · {observation.createdAt}
                    </p>
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

export default MemoriesPage;
