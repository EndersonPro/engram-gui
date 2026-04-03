import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface QueryStateProps {
  /** Show loading skeletons when true AND data is not yet available. */
  isLoading: boolean;
  /** Whether the first data payload has arrived (prevents skeleton flash on refetch). */
  hasData: boolean;
  /** Error info — renders a danger alert with optional retry. */
  error?: { message: string; onRetry?: () => void; retryLabel?: string };
  /** Renders an informational alert when there's nothing to show. */
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Accessible label for the loading skeleton region. */
  loadingLabel?: string;
  /** Content rendered ONLY when none of the above states are active. */
  children?: ReactNode;
}

export const QueryState = ({
  isLoading,
  hasData,
  error,
  isEmpty,
  emptyMessage = "No data available yet.",
  loadingLabel = "Loading",
  children,
}: QueryStateProps) => {
  if (isLoading && !hasData) {
    return (
      <div className="space-y-2" aria-label={loadingLabel}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <p>{error.message}</p>
        {error.onRetry ? (
          <div className="mt-2">
            <Button variant="destructive" onClick={error.onRetry}>
              {error.retryLabel ?? "Retry"}
            </Button>
          </div>
        ) : null}
      </Alert>
    );
  }

  if (isEmpty) {
    return <Alert>{emptyMessage}</Alert>;
  }

  return <>{children}</>;
};
