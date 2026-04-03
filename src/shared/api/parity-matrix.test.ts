import { describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createParityMatrixPlan,
  renderParityMatrixEvidence,
  runRuntimeParityMatrixVerification,
  verifyParityMatrix,
} from "@shared/api/parity-matrix";

describe("parity matrix verification", () => {
  it("groups endpoint checks by family and reports pass/fail counts", async () => {
    const plan = createParityMatrixPlan("http://127.0.0.1:8000");
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/search") {
        return new Response(JSON.stringify({ error: "missing q" }), { status: 400 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const report = await verifyParityMatrix(plan, fetcher);

    expect(report.families).toHaveLength(7);
    expect(report.summary.pass).toBe(11);
    expect(report.summary.fail).toBe(1);

    const searchFamily = report.families.find((family) => family.family === "search_timeline_context");
    expect(searchFamily).toBeDefined();
    expect(searchFamily?.endpoints).toHaveLength(3);
    expect(searchFamily?.fail).toBe(1);
    expect(searchFamily?.pass).toBe(2);
  });

  it("renders markdown evidence with family summary and endpoint rows", () => {
    const markdown = renderParityMatrixEvidence({
      generatedAt: "2026-04-02T00:00:00.000Z",
      runtimeBaseUrl: "http://127.0.0.1:8000",
      summary: { pass: 11, fail: 1 },
      families: [
        {
          family: "health",
          pass: 1,
          fail: 0,
          endpoints: [
            {
              route: "/health",
              statusCode: 200,
              result: "PASS",
              detail: "HTTP 200",
            },
          ],
        },
        {
          family: "search_timeline_context",
          pass: 2,
          fail: 1,
          endpoints: [
            {
              route: "/search?q=engram-gui&limit=1",
              statusCode: 400,
              result: "FAIL",
              detail: "HTTP 400 :: missing q",
            },
          ],
        },
      ],
    });

    expect(markdown).toContain("# GET Parity Matrix Evidence");
    expect(markdown).toContain("| health | 1 | 0 |");
    expect(markdown).toContain("| search_timeline_context | 2 | 1 |");
    expect(markdown).toContain("| /search?q=engram-gui&limit=1 | FAIL | 400 | HTTP 400 :: missing q |");
  });

  it("writes local runtime evidence file with pass/fail rows", async () => {
    const outputFilePath = `${process.cwd()}/artifacts/parity-matrix-evidence.md`;
    const tempRoot = await mkdtemp(join(tmpdir(), "parity-matrix-"));
    const configFilePath = join(tempRoot, ".engram-gui", "config.json");

    await mkdir(join(tempRoot, ".engram-gui"), { recursive: true });
    await writeFile(
      configFilePath,
      JSON.stringify({ apiBaseUrl: "http://127.0.0.1:7437" }),
      "utf8",
    );

    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const report = await runRuntimeParityMatrixVerification({
      outputFilePath,
      configFilePath,
      fetcher,
    });

    expect(report.runtimeBaseUrl).toBe("http://127.0.0.1:7437");
    expect(report.families).toHaveLength(7);
    expect(report.summary).toEqual({ pass: 12, fail: 0 });

    const markdown = await readFile(outputFilePath, "utf8");
    expect(markdown).toContain("# GET Parity Matrix Evidence");
    expect(markdown).toContain("- Runtime base URL: http://127.0.0.1:7437");
    expect(markdown).toContain("## Family Summary");
    expect(markdown).toContain("## Endpoint Results");
    expect(markdown).toContain("- Summary: 12 PASS / 0 FAIL");
    expect(markdown).not.toContain("NETWORK_ERROR");
    expect(fetcher).toHaveBeenCalledTimes(12);
  });
});
