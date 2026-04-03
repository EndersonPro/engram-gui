import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RuntimeProcessState } from "@shared/types/runtime";

export interface RuntimeStatusCardProps {
  binaryAvailable: boolean;
  processState: RuntimeProcessState;
  failureReason: string | null;
  healthSummary: string;
}

const processLabel: Record<RuntimeProcessState, string> = {
  unavailable: "Unavailable",
  idle: "Idle",
  starting: "Starting",
  running: "Running",
  error: "Failure",
};

const processVariant: Record<RuntimeProcessState, "default" | "success" | "warning" | "danger"> = {
  unavailable: "warning",
  idle: "default",
  starting: "warning",
  running: "success",
  error: "danger",
};

const processCopy: Record<RuntimeProcessState, string> = {
  unavailable: "No Engram binary detected. Configure binary path to enable lifecycle actions.",
  idle: "Engram runtime is stopped and ready to start.",
  starting: "Engram runtime is currently starting.",
  running: "Engram runtime is healthy and running.",
  error: "Runtime command failed. Inspect failure reason and retry.",
};

export const RuntimeStatusCard = ({
  binaryAvailable,
  processState,
  failureReason,
  healthSummary,
}: RuntimeStatusCardProps) => {
  return (
    <Card data-tahoe-status="elevated" data-testid="runtime-status-card">
      <CardHeader>
        <CardTitle>Engram Runtime Status</CardTitle>
        <CardDescription>{processCopy[processState]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant={binaryAvailable ? "success" : "warning"}>Binary {binaryAvailable ? "Available" : "Unavailable"}</Badge>
          <Badge variant={processVariant[processState]}>Process {processLabel[processState]}</Badge>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">Health: {healthSummary}</p>
        {failureReason ? <p className="text-sm text-[var(--status-danger)]">Failure reason: {failureReason}</p> : null}
      </CardContent>
    </Card>
  );
};
