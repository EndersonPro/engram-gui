import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RuntimeStatusCard } from "@features/engram-status/ui/runtime-status-card";

describe("RuntimeStatusCard", () => {
  it("renders unavailable status badges and guidance when binary is missing", () => {
    const html = renderToString(
      createElement(RuntimeStatusCard, {
        binaryAvailable: false,
        processState: "unavailable",
        failureReason: null,
        healthSummary: "Unknown",
      }),
    );

    expect(html).toContain("Engram Runtime Status");
    expect(html).toContain("Binary");
    expect(html).toContain("Process");
    expect(html).toContain("Unavailable");
    expect(html).toContain("No Engram binary detected");
  });

  it("renders running state badges with health summary", () => {
    const html = renderToString(
      createElement(RuntimeStatusCard, {
        binaryAvailable: true,
        processState: "running",
        failureReason: null,
        healthSummary: "ok (2026-04-02T00:00:00Z)",
      }),
    );

    expect(html).toContain("Process");
    expect(html).toContain("Running");
    expect(html).toContain("Health:");
    expect(html).toContain("ok (2026-04-02T00:00:00Z)");
    expect(html).toContain('data-tahoe-status="elevated"');
  });

  it("shows explicit failure reason when process is in error state", () => {
    const html = renderToString(
      createElement(RuntimeStatusCard, {
        binaryAvailable: true,
        processState: "error",
        failureReason: "ALREADY_STOPPED",
        healthSummary: "Retryable failure",
      }),
    );

    expect(html).toContain("Process");
    expect(html).toContain("Failure");
    expect(html).toContain("Failure reason:");
    expect(html).toContain("ALREADY_STOPPED");
  });
});
