import { describe, expect, it, vi } from "vitest";

import { createSettingsQueryOptions } from "@features/settings/api/use-settings";
import * as runtimeCommands from "@features/engram-status/api/runtime-commands";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

describe("createSettingsQueryOptions", () => {
  it("composes sync status, stats, and local runtime config", async () => {
    const getSyncStatusSpy = vi.spyOn(engramApiAdapter, "getSyncStatus").mockResolvedValue({
      kind: "success",
      data: {
        enabled: true,
        phase: "healthy",
        consecutive_failures: 0,
      },
    });
    const getStatsSpy = vi.spyOn(engramApiAdapter, "getStats").mockResolvedValue({
      kind: "success",
      data: {
        totalSessions: 12,
        totalObservations: 48,
        totalPrompts: 10,
        projects: ["engram-gui"],
      },
    });
    const configSpy = vi.spyOn(runtimeCommands, "getEngramConfig").mockResolvedValue({
      binaryPath: "/tmp/engram",
      apiBaseUrl: "http://127.0.0.1:8000",
      healthUrl: "http://127.0.0.1:8000/health",
    });

    const options = createSettingsQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.settings.overview);
    expect(result).toEqual({
      kind: "success",
      data: {
        sync: {
          enabled: true,
          phase: "healthy",
          consecutive_failures: 0,
        },
        stats: {
          totalSessions: 12,
          totalObservations: 48,
          totalPrompts: 10,
          projects: ["engram-gui"],
        },
        config: {
          binaryPath: "/tmp/engram",
          apiBaseUrl: "http://127.0.0.1:8000",
          healthUrl: "http://127.0.0.1:8000/health",
        },
        issues: [],
      },
    });
    expect(getSyncStatusSpy).toHaveBeenCalledWith({});
    expect(getStatsSpy).toHaveBeenCalledWith({});
    expect(configSpy).toHaveBeenCalledTimes(1);
  });

  it("returns empty when sync payload is unavailable", async () => {
    const getSyncStatusSpy = vi.spyOn(engramApiAdapter, "getSyncStatus").mockResolvedValue({
      kind: "empty",
      data: null,
    });
    const getStatsSpy = vi.spyOn(engramApiAdapter, "getStats").mockResolvedValue({
      kind: "success",
      data: {
        totalSessions: 12,
        totalObservations: 48,
        totalPrompts: 10,
        projects: ["engram-gui"],
      },
    });
    const configSpy = vi.spyOn(runtimeCommands, "getEngramConfig").mockResolvedValue({
      binaryPath: "/tmp/engram",
      apiBaseUrl: "http://127.0.0.1:8000",
      healthUrl: "http://127.0.0.1:8000/health",
    });

    const options = createSettingsQueryOptions();
    const result = await options.queryFn();

    expect(options.queryKey).toEqual(queryKeys.engram.settings.overview);
    expect(result).toEqual({
      kind: "empty",
      data: null,
    });
    expect(getSyncStatusSpy).toHaveBeenCalledWith({});
    expect(getStatsSpy).toHaveBeenCalledWith({});
    expect(configSpy).toHaveBeenCalledTimes(1);
  });

  it("returns degraded success when one runtime source fails", async () => {
    vi.spyOn(engramApiAdapter, "getSyncStatus").mockResolvedValue({
      kind: "success",
      data: {
        enabled: true,
        phase: "healthy",
        consecutive_failures: 0,
      },
    });
    vi.spyOn(engramApiAdapter, "getStats").mockResolvedValue({
      kind: "retryable_failure",
      error: {
        code: "HTTP_503",
        message: "stats unavailable",
        retryable: true,
      },
    });
    vi.spyOn(runtimeCommands, "getEngramConfig").mockResolvedValue({
      binaryPath: "/tmp/engram",
      apiBaseUrl: "http://127.0.0.1:8000",
      healthUrl: "http://127.0.0.1:8000/health",
    });

    const options = createSettingsQueryOptions();
    const result = await options.queryFn();

    expect(result).toEqual({
      kind: "success",
      data: {
        sync: {
          enabled: true,
          phase: "healthy",
          consecutive_failures: 0,
        },
        stats: null,
        config: {
          binaryPath: "/tmp/engram",
          apiBaseUrl: "http://127.0.0.1:8000",
          healthUrl: "http://127.0.0.1:8000/health",
        },
        issues: [
          {
            source: "stats",
            message: "stats unavailable",
            retryable: true,
          },
        ],
      },
    });
  });
});
