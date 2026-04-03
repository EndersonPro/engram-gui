import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";

import { CardContent, CardHeader } from "@/components/ui/card";
import { ContextIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";
import { QueryState } from "@/components/ui/query-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useContextData } from "@features/context/api/use-context";

const ContextPage = () => {
  const [projectFilter, setProjectFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("project");

  const { data, isLoading, isFetching, refetch } = useContextData({
    project: projectFilter || undefined,
    scope: scopeFilter || undefined
  });

  const context = data?.kind === "success" ? data.data : null;
  const isErrorState = data?.kind === "retryable_failure";
  const isEmptyState = data?.kind === "empty" || (data?.kind === "success" && data.data === null);

  return (
    <section className="space-y-4">
      <>
        <CardHeader>
          <PageHeading icon={ContextIcon} subtitle="Live context insights with explicit loading, empty, error, and data rendering." title="Project context" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 bg-[var(--surface-panel-elevated)] p-4 rounded-xl border border-[color:var(--chrome-edge-highlight)] shadow-sm mb-6">
            <label className="flex flex-col gap-1.5 flex-1 text-sm font-semibold text-[var(--text-primary)]">
              Reference Project
              <Input
                placeholder="e.g., engram-gui or leave blank for all"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-11 bg-[var(--surface-control)] text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 min-w-[200px] text-sm font-semibold text-[var(--text-primary)]">
              Scope Constraint
              <Select
                value={scopeFilter || "all"}
                onValueChange={(v) => setScopeFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="bg-[var(--surface-control)] w-[200px]">
                  <SelectValue placeholder="Any Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project Level</SelectItem>
                  <SelectItem value="personal">Personal Limits</SelectItem>
                  <SelectItem value="all">Any Scope</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <Separator tone="soft" className="mb-6" />

          <QueryState
            isLoading={isLoading || isFetching}
            hasData={!!data}
            error={isErrorState ? { message: data.error.message, onRetry: () => void refetch(), retryLabel: "Retry context" } : undefined}
            isEmpty={isEmptyState}
            emptyMessage="No project context available yet."
            loadingLabel="Loading context"
          >
            {context ? (
              <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-[var(--surface-overlay)] max-w-none text-[var(--text-primary)] p-5 rounded-xl bg-[var(--surface-panel-elevated)]/50 border border-[color:var(--chrome-edge-highlight)] shadow-sm">
                <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw as any]}>
                  {context.context}
                </ReactMarkdown>
              </div>
            ) : null}
          </QueryState>
        </CardContent>
      </>
    </section>
  );
};

export default ContextPage;
