import { Badge } from "@/components/ui/badge";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon } from "@features/engram-status/ui/runtime-status-icons";
import type { RuntimeProcessState } from "@shared/types/runtime";

export interface RuntimeStatusCardProps {
  binaryAvailable: boolean;
  processState: RuntimeProcessState;
  failureReason: string | null;
  healthSummary: string;
  healthOk: boolean;
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
  healthOk,
}: RuntimeStatusCardProps) => {
  const HealthIcon = healthOk ? CheckCircleIcon : XCircleIcon;
  const healthLabel = healthOk ? "Healthy" : "Unhealthy";

  return (
    <>
      <CardHeader className="space-y-0.5">
        <CardTitle>Engram Runtime</CardTitle>
        <CardDescription>{processCopy[processState]}</CardDescription>
      </CardHeader>
      <CardContent className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant={binaryAvailable ? "success" : "warning"}>Binary {binaryAvailable ? "Available" : "Unavailable"}</Badge>
          <Badge variant={processVariant[processState]}>Process {processLabel[processState]}</Badge>
          <Badge
            variant={healthOk ? "success" : "danger"}
            accent={
              <HealthIcon
                aria-hidden="true"
                className={healthOk ? "h-3.5 w-3.5 text-[var(--status-success)]" : "h-3.5 w-3.5 text-[var(--status-danger)]"}
                focusable="false"
              />
            }
            data-health-state={healthOk ? "ok" : "error"}
          >
            Health {healthLabel}
          </Badge>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">{healthSummary}</p>
        {failureReason ? <p className="text-xs text-[var(--status-danger)]">Failure reason: {failureReason}</p> : null}
      </CardContent>
    </>
  );
};
