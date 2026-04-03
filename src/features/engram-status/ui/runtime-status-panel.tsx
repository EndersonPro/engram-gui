import { useEffect, useMemo, useState } from "react";

import {
  checkEngramStatus,
  restartEngram,
  startEngram,
  stopEngram,
} from "@features/engram-status/api/runtime-commands";
import { useHealthStatus } from "@features/engram-status/api/use-health-status";
import type { RuntimeStatusPayload } from "@features/engram-status/state/runtime-store";
import { useRuntimeStore } from "@features/engram-status/state/runtime-store";
import { RuntimeStatusCard } from "@features/engram-status/ui/runtime-status-card";
import { PlayIcon, RefreshIcon, RestartIcon, StopIcon } from "@features/engram-status/ui/runtime-status-icons";

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
    <div className="space-y-3">
      <RuntimeStatusCard
        binaryAvailable={binaryAvailable}
        processState={processState}
        failureReason={failureReason}
        healthSummary={healthSummary}
        healthOk={healthOk}
      />

      {/* macOS-style toolbar dock */}
      <div
        className="
          inline-flex w-full rounded-xl overflow-hidden
          border border-[color:var(--chrome-edge-highlight)]
          bg-[var(--surface-control)]/80
          backdrop-blur-[var(--glass-blur)]
          shadow-[var(--shadow-soft)]
          divide-x divide-[color:var(--chrome-edge-highlight)]
        "
        role="toolbar"
        aria-label="Lifecycle controls"
      >
        {/* Start */}
        <button
          className="
            group flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2
            text-[var(--text-secondary)] transition-all duration-[var(--motion-duration-fast)]
            hover:bg-[var(--accent-solid)] hover:text-white
            disabled:pointer-events-none disabled:opacity-40
            focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)]
          "
          disabled={isMutating}
          onClick={() => runLifecycleAction("start")}
          type="button"
          title="Start Engram"
        >
          <PlayIcon aria-hidden="true" className="h-5 w-5 shrink-0" focusable="false" />
          <span className="text-[9px] font-semibold tracking-wider uppercase leading-none">Start</span>
        </button>

        {/* Stop */}
        <button
          className="
            group flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2
            text-[var(--text-secondary)] transition-all duration-[var(--motion-duration-fast)]
            hover:bg-[color-mix(in_oklch,var(--status-danger)_80%,transparent)] hover:text-white
            disabled:pointer-events-none disabled:opacity-40
            focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)]
          "
          disabled={isMutating}
          onClick={() => runLifecycleAction("stop")}
          type="button"
          title="Stop Engram"
        >
          <StopIcon aria-hidden="true" className="h-5 w-5 shrink-0" focusable="false" />
          <span className="text-[9px] font-semibold tracking-wider uppercase leading-none">Stop</span>
        </button>

        {/* Restart */}
        <button
          className="
            group flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2
            text-[var(--text-secondary)] transition-all duration-[var(--motion-duration-fast)]
            hover:bg-[color-mix(in_oklch,var(--status-warning)_80%,transparent)] hover:text-white
            disabled:pointer-events-none disabled:opacity-40
            focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)]
          "
          disabled={isMutating}
          onClick={() => runLifecycleAction("restart")}
          type="button"
          title="Restart Engram"
        >
          <RestartIcon aria-hidden="true" className="h-5 w-5 shrink-0" focusable="false" />
          <span className="text-[9px] font-semibold tracking-wider uppercase leading-none">Restart</span>
        </button>

        {/* Divider + Refresh (ghost action, separated) */}
        <button
          className="
            flex flex-col items-center justify-center gap-1 py-2.5 px-3
            text-[var(--text-muted)] transition-all duration-[var(--motion-duration-fast)]
            hover:bg-[var(--surface-control-hover)] hover:text-[var(--text-strong)]
            disabled:pointer-events-none disabled:opacity-40
            focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)]
          "
          disabled={isMutating}
          onClick={() => {
            void refreshRuntimeStatus(checkEngramStatus, applyRuntimeStatus);
          }}
          type="button"
          title="Refresh status"
        >
          <RefreshIcon
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isMutating ? "animate-spin" : ""}`}
            focusable="false"
          />
          <span className="text-[9px] font-semibold tracking-wider uppercase leading-none">Sync</span>
        </button>
      </div>
    </div>
  );
};
