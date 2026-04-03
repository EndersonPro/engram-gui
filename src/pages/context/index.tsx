import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createContextQueryOptions, useContextData } from "@features/context/api/use-context";

const ContextPage = () => {
  const { data, isLoading, isFetching, refetch } = useContextData({ scope: "project" });
  const queryKey = createContextQueryOptions({ scope: "project" }).queryKey;

  const context = data?.kind === "success" ? data.data : null;
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && data.data === null);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <PageHeading
            accentSymbol="📎"
            subtitle="Live context insights with explicit loading, empty, error, and data rendering."
            title="Project context"
          />
          <p className="text-[var(--type-caption)] text-[var(--text-muted)]">Query key: {queryKey.join("/")}</p>
        </CardHeader>
        <CardContent>
          <Separator tone="soft" />
          {(isLoading || isFetching) && !data ? (
            <div className="space-y-2" aria-label="Loading context">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isErrorState ? (
            <Alert variant="danger">
              <p>Unable to load context: {data.error.message}</p>
              <div className="mt-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Retry context
                </Button>
              </div>
            </Alert>
          ) : null}

          {isEmptyState ? <Alert>No project context available yet.</Alert> : null}

          {context ? <Alert>{context.context}</Alert> : null}
        </CardContent>
      </Card>
    </section>
  );
};

export default ContextPage;
