import { useQuery } from "@tanstack/react-query";

import type { SettingsParams } from "@shared/api/contracts/non-health-types";
import type { EngramConfigDto } from "@features/engram-status/api/runtime-commands";
import { getEngramConfig } from "@features/engram-status/api/runtime-commands";
import type { StatsDto, SyncStatusDto } from "@shared/api/engram-adapter";
import type { AdapterResult, RetryableFailure } from "@shared/types/adapter";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: SettingsParams = {
  profile: undefined,
};

export interface SettingsOverviewDto {
  sync: SyncStatusDto | null;
  stats: StatsDto | null;
  config: EngramConfigDto | null;
  issues: SettingsIssue[];
}

type SettingsIssueSource = "sync" | "stats" | "config";

export interface SettingsIssue {
  source: SettingsIssueSource;
  message: string;
  retryable: true;
}

const toIssue = (source: SettingsIssueSource, message: string): SettingsIssue => ({
  source,
  message,
  retryable: true,
});

const toCompositeSettings = (
  syncStatusResult: Awaited<ReturnType<typeof engramApiAdapter.getSyncStatus>>,
  statsResult: Awaited<ReturnType<typeof engramApiAdapter.getStats>>,
  configResult: EngramConfigDto | RetryableFailure,
): AdapterResult<SettingsOverviewDto | null, RetryableFailure> => {
  if (syncStatusResult.kind === "empty") {
    return { kind: "empty", data: null };
  }

  if (syncStatusResult.kind === "success" && syncStatusResult.data === null) {
    return { kind: "empty", data: null };
  }

  if (statsResult.kind === "empty") {
    return { kind: "empty", data: null };
  }

  if (statsResult.kind === "success" && statsResult.data === null) {
    return { kind: "empty", data: null };
  }

  const issues: SettingsIssue[] = [];
  let sync: SyncStatusDto | null = null;
  if (syncStatusResult.kind === "success") {
    sync = syncStatusResult.data;
  } else {
    issues.push(toIssue("sync", syncStatusResult.error.message));
  }

  let stats: StatsDto | null = null;
  if (statsResult.kind === "success") {
    stats = statsResult.data;
  } else {
    issues.push(toIssue("stats", statsResult.error.message));
  }

  const config =
    "retryable" in configResult
      ? (issues.push(toIssue("config", configResult.message)), null)
      : configResult;

  if (!sync && !stats && !config && issues.length > 0) {
    return {
      kind: "retryable_failure",
      error: {
        code: "SETTINGS_UNAVAILABLE",
        message: "Unable to load any settings sources",
        retryable: true,
      },
    };
  }

  return {
    kind: "success",
    data: {
      sync,
      stats,
      config,
      issues,
    },
  };
};

export const createSettingsQueryOptions = (_params: SettingsParams = defaultParams) => ({
  queryKey: queryKeys.engram.settings.overview,
  queryFn: async () => {
    const [syncStatusResult, statsResult, configResult] = await Promise.all([
      engramApiAdapter.getSyncStatus({}),
      engramApiAdapter.getStats({}),
      getEngramConfig().catch<RetryableFailure>((error: unknown) => ({
        code: "TAURI_RUNTIME_ERROR",
        message: error instanceof Error ? error.message : "Failed to load local runtime config",
        retryable: true,
      })),
    ]);

    return toCompositeSettings(syncStatusResult, statsResult, configResult);
  },
  staleTime: 5_000,
});

export const useSettings = (params: SettingsParams = defaultParams) => {
  return useQuery(createSettingsQueryOptions(params));
};
