import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  checkEngramStatus,
  restartEngram,
  startEngram,
  stopEngram,
} from "@features/engram-status/api/runtime-commands";
import type { RuntimeStatusPayload } from "@features/engram-status/state/runtime-store";
import { useHealthStatus } from "@features/engram-status/api/use-health-status";
import { PlayIcon, RefreshIcon, RestartIcon, StopIcon } from "@features/engram-status/ui/runtime-status-icons";
import { RuntimeStatusCard } from "@features/engram-status/ui/runtime-status-card";
import { useRuntimeStore } from "@features/engram-status/state/runtime-store";

type LifecycleAction = "start" | "stop" | "restart";

const lifecycleActions: Record<LifecycleAction, () => Promise<unknown>> = {
  start: startEngram,
  stop: stopEngram,
  restart: restartEngram,
};

export const refreshRuntimeStatus = async (
  checkRuntimeStatus: () => Promise<RuntimeStatusPayload>,
  applyRuntimeStatus: (status: RuntimeStatusPayload) => void,
) => {
  try {
    const status = await checkRuntimeStatus();
    applyRuntimeStatus(status);
  } catch {
    applyRuntimeStatus({
      binaryAvailable: false,
      processState: "error",
      health: null,
      failureReason: "Could not read desktop runtime status.",
    });
  }
};

export const RuntimeStatusPanel = () => {
  const [isMutating, setIsMutating] = useState(false);
  const { data: healthResult } = useHealthStatus();
  const { binaryAvailable, processState, failureReason, applyRuntimeStatus, applyHealthResult } = useRuntimeStore();

  useEffect(() => {
    void refreshRuntimeStatus(checkEngramStatus, applyRuntimeStatus);
  }, [applyRuntimeStatus]);

  useEffect(() => {
    if (!healthResult) {
      return;
    }

    applyHealthResult(healthResult);
  }, [healthResult, applyHealthResult]);

  const healthSummary = useMemo(() => {
    if (!healthResult) {
      return "Unknown";
    }

    if (healthResult.kind === "retryable_failure") {
      return "Retryable failure";
    }

    if (!healthResult.data) {
      return "No health data";
    }

    return `${healthResult.data.status} (${healthResult.data.checkedAt})`;
  }, [healthResult]);

  const healthOk = healthResult?.kind === "success" && healthResult.data?.status === "ok";

  const runLifecycleAction = async (action: LifecycleAction) => {
    setIsMutating(true);

    try {
      const next = await lifecycleActions[action]();
      applyRuntimeStatus(next as Parameters<typeof applyRuntimeStatus>[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lifecycle action failed";
      applyRuntimeStatus({
        binaryAvailable,
        processState: "error",
        health: null,
        failureReason: message,
      });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <RuntimeStatusCard
        binaryAvailable={binaryAvailable}
        processState={processState}
        failureReason={failureReason}
        healthSummary={healthSummary}
        healthOk={healthOk}
      />

      <div className="flex flex-wrap gap-2">
        <Button disabled={isMutating} onClick={() => runLifecycleAction("start")} type="button">
          <PlayIcon aria-hidden="true" className="h-4 w-4" focusable="false" />
          Start
        </Button>
        <Button variant="secondary" disabled={isMutating} onClick={() => runLifecycleAction("stop")} type="button">
          <StopIcon aria-hidden="true" className="h-4 w-4" focusable="false" />
          Stop
        </Button>
        <Button variant="secondary" disabled={isMutating} onClick={() => runLifecycleAction("restart")} type="button">
          <RestartIcon aria-hidden="true" className="h-4 w-4" focusable="false" />
          Restart
        </Button>
        <Button
          variant="ghost"
          disabled={isMutating}
          onClick={() => {
            void refreshRuntimeStatus(checkEngramStatus, applyRuntimeStatus);
          }}
          type="button"
        >
          <RefreshIcon aria-hidden="true" className="h-4 w-4" focusable="false" />
          Refresh status
        </Button>
      </div>
    </div>
  );
};
