import { describe, expect, it, vi } from "vitest";

import { createEngramApiAdapter, normalizeHealthPayload } from "@shared/api/engram-adapter";
import {
  nonHealthContractKeys,
  nonHealthContracts,
  validateNonHealthContractShape,
} from "@shared/api/contracts/non-health-contracts";
import { HttpError, type HttpClient } from "@shared/api/http";
import type { HealthStatusDto } from "@shared/types/runtime";

describe("normalizeHealthPayload", () => {
  it("returns success when health payload exists", () => {
    const payload: HealthStatusDto = {
      status: "ok",
      checkedAt: "2026-04-01T00:00:00Z",
    };

    expect(normalizeHealthPayload(payload)).toEqual({
      kind: "success",
      data: payload,
    });
  });

  it("returns empty when payload is null", () => {
    expect(normalizeHealthPayload(null)).toEqual({
      kind: "empty",
      data: null,
    });
  });
});

describe("non-health contract registry", () => {
  it("contains all parity contract keys and excludes synthetic ones", () => {
    expect(nonHealthContractKeys).toEqual([
      "sessions.recent",
      "observations.recent",
      "observations.getById",
      "search.query",
      "timeline.list",
      "prompts.recent",
      "prompts.search",
      "context.get",
      "export.get",
      "stats.get",
      "sync.status",
    ]);

    expect(nonHealthContractKeys).not.toContain("memories.list");
    expect(nonHealthContractKeys).not.toContain("settings.get");
  });

  it("accepts parity contract shape entries", () => {
    const validation = validateNonHealthContractShape(nonHealthContracts["search.query"]);
    expect(validation).toEqual({ ok: true, issues: [] });
  });
});

describe("createEngramApiAdapter parity compatibility", () => {
  /**
   * Phase 4.4 closure checklist (GET parity)
   * - [x] 12 GET adapter domains have scenario-traceable tests (success + malformed rejection)
   * - [x] Route/query/path mapping assertions are explicit per endpoint family
   * - [x] Required params (`q`, `observation_id`, `id`) propagate VALIDATION_ERROR
   * - [x] Synthetic transport routes (`/memories`, `/settings`) stay out of parity contracts
   * - [x] No non-GET coverage added in this phase
   */
  type DomainCase = {
    name: string;
    payload: unknown;
    expectedData: unknown;
    expectedPath: string;
    expectedQuery: Record<string, string | number | boolean | undefined>;
    run: ReturnType<typeof createEngramApiAdapter> extends infer TAdapter
      ? (adapter: TAdapter & ReturnType<typeof createEngramApiAdapter>) => Promise<unknown>
      : never;
  };

  const canonicalObservationRaw = {
    id: 7,
    sync_id: "obs-sync-7",
    session_id: "sess-7",
    type: "architecture",
    title: "contract parity",
    content: "contract parity",
    tool_name: "vitest",
    project: "engram",
    scope: "project",
    topic_key: "parity/contracts",
    revision_count: 1,
    duplicate_count: 0,
    created_at: "2026-04-02T00:00:00Z",
    updated_at: "2026-04-02T00:00:00Z",
  };

  const canonicalObservationDto = {
    id: 7,
    syncId: "obs-sync-7",
    sessionId: "sess-7",
    type: "architecture",
    title: "contract parity",
    content: "contract parity",
    toolName: "vitest",
    project: "engram",
    scope: "project",
    topicKey: "parity/contracts",
    revisionCount: 1,
    duplicateCount: 0,
    lastSeenAt: undefined,
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z",
    deletedAt: undefined,
  };

  const domainCases: DomainCase[] = [
    {
      name: "sessions.recent",
      payload: [
        {
          id: "sess-11",
          project: "engram",
          started_at: "2026-04-02T00:00:00Z",
          ended_at: "2026-04-02T01:00:00Z",
          summary: "Apply phase",
          observation_count: 4,
        },
      ],
      expectedData: [
        {
          id: "sess-11",
          project: "engram",
          startedAt: "2026-04-02T00:00:00Z",
          endedAt: "2026-04-02T01:00:00Z",
          summary: "Apply phase",
          observationCount: 4,
        },
      ],
      expectedPath: "/sessions/recent",
      expectedQuery: { project: "engram", limit: 5 },
      run: (adapter) => adapter.listRecentSessions({ project: "engram", limit: 5 }),
    },
    {
      name: "observations.recent",
      payload: [canonicalObservationRaw],
      expectedData: [canonicalObservationDto],
      expectedPath: "/observations/recent",
      expectedQuery: { project: "engram", scope: "project", limit: 5 },
      run: (adapter) => adapter.listRecentObservations({ project: "engram", scope: "project", limit: 5 }),
    },
    {
      name: "observations.getById",
      payload: canonicalObservationRaw,
      expectedData: canonicalObservationDto,
      expectedPath: "/observations/7",
      expectedQuery: {},
      run: (adapter) => adapter.getObservationById({ id: 7 }),
    },
    {
      name: "search.query",
      payload: [
        {
          ...canonicalObservationRaw,
          rank: 0.99,
        },
      ],
      expectedData: [
        {
          rank: 0.99,
          observation: canonicalObservationDto,
        },
      ],
      expectedPath: "/search",
      expectedQuery: { q: "engram", limit: 5, project: "engram", scope: "project" },
      run: (adapter) => adapter.searchQuery({ q: "engram", limit: 5, project: "engram", scope: "project" }),
    },
    {
      name: "timeline.list",
      payload: {
        focus: canonicalObservationRaw,
        before: [
          {
            ...canonicalObservationRaw,
            id: 6,
            sync_id: undefined,
            is_focus: false,
          },
        ],
        after: [
          {
            ...canonicalObservationRaw,
            id: 8,
            sync_id: undefined,
            is_focus: false,
          },
        ],
        session_info: {
          id: "sess-7",
          project: "engram",
          directory: "/tmp/engram",
          started_at: "2026-04-02T00:00:00Z",
        },
        total_in_range: 3,
      },
      expectedData: {
        focus: canonicalObservationDto,
        before: [{ ...canonicalObservationDto, id: 6, syncId: "timeline-6", isFocus: false }],
        after: [{ ...canonicalObservationDto, id: 8, syncId: "timeline-8", isFocus: false }],
        sessionInfo: {
          id: "sess-7",
          project: "engram",
          directory: "/tmp/engram",
          startedAt: "2026-04-02T00:00:00Z",
          endedAt: undefined,
          summary: undefined,
        },
        totalInRange: 3,
      },
      expectedPath: "/timeline",
      expectedQuery: { observation_id: 7, before: 3, after: 5 },
      run: (adapter) => adapter.listTimeline({ observation_id: 7, before: 3, after: 5 }),
    },
    {
      name: "timeline.list normalizes null before/after",
      payload: {
        focus: canonicalObservationRaw,
        before: null,
        after: null,
        total_in_range: 1,
      },
      expectedData: {
        focus: canonicalObservationDto,
        before: [],
        after: [],
        sessionInfo: undefined,
        totalInRange: 1,
      },
      expectedPath: "/timeline",
      expectedQuery: { observation_id: 7, before: 3, after: 5 },
      run: (adapter) => adapter.listTimeline({ observation_id: 7, before: 3, after: 5 }),
    },
    {
      name: "prompts.recent",
      payload: [
        {
          id: 4,
          sync_id: "prompt-sync-4",
          session_id: "sess-4",
          project: "engram",
          content: "prompt",
          created_at: "2026-04-02T00:00:00Z",
        },
      ],
      expectedData: [
        {
          id: 4,
          syncId: "prompt-sync-4",
          sessionId: "sess-4",
          project: "engram",
          content: "prompt",
          createdAt: "2026-04-02T00:00:00Z",
        },
      ],
      expectedPath: "/prompts/recent",
      expectedQuery: { project: "engram", limit: 5 },
      run: (adapter) => adapter.listRecentPrompts({ project: "engram", limit: 5 }),
    },
    {
      name: "prompts.search",
      payload: [
        {
          id: 4,
          sync_id: "prompt-sync-4",
          session_id: "sess-4",
          project: "engram",
          content: "prompt",
          created_at: "2026-04-02T00:00:00Z",
        },
      ],
      expectedData: [
        {
          id: 4,
          syncId: "prompt-sync-4",
          sessionId: "sess-4",
          project: "engram",
          content: "prompt",
          createdAt: "2026-04-02T00:00:00Z",
        },
      ],
      expectedPath: "/prompts/search",
      expectedQuery: { q: "engram", project: "engram", limit: 5 },
      run: (adapter) => adapter.searchPrompts({ q: "engram", project: "engram", limit: 5 }),
    },
    {
      name: "context.get",
      payload: { context: "ctx" },
      expectedData: { context: "ctx" },
      expectedPath: "/context",
      expectedQuery: { project: "engram", scope: "project" },
      run: (adapter) => adapter.getContext({ project: "engram", scope: "project" }),
    },
    {
      name: "export.get",
      payload: {
        version: "0.1.0",
        exported_at: "2026-04-02T00:00:00Z",
        sessions: [
          {
            id: "sess-1",
            project: "engram",
            directory: "/tmp/engram",
            started_at: "2026-04-02T00:00:00Z",
          },
        ],
        observations: [canonicalObservationRaw],
        prompts: [
          {
            id: 3,
            sync_id: "prompt-sync-3",
            session_id: "sess-1",
            project: "engram",
            content: "prompt",
            created_at: "2026-04-02T00:00:00Z",
          },
        ],
      },
      expectedData: {
        version: "0.1.0",
        exportedAt: "2026-04-02T00:00:00Z",
        sessions: [
          {
            id: "sess-1",
            project: "engram",
            directory: "/tmp/engram",
            startedAt: "2026-04-02T00:00:00Z",
            endedAt: undefined,
            summary: undefined,
          },
        ],
        observations: [canonicalObservationDto],
        prompts: [
          {
            id: 3,
            syncId: "prompt-sync-3",
            sessionId: "sess-1",
            project: "engram",
            content: "prompt",
            createdAt: "2026-04-02T00:00:00Z",
          },
        ],
      },
      expectedPath: "/export",
      expectedQuery: {},
      run: (adapter) => adapter.getExport({}),
    },
    {
      name: "stats.get",
      payload: {
        total_sessions: 10,
        total_observations: 20,
        total_prompts: 5,
        projects: ["engram"],
      },
      expectedData: {
        totalSessions: 10,
        totalObservations: 20,
        totalPrompts: 5,
        projects: ["engram"],
      },
      expectedPath: "/stats",
      expectedQuery: {},
      run: (adapter) => adapter.getStats({}),
    },
    {
      name: "sync.status",
      payload: { enabled: false, message: "background sync is not configured" },
      expectedData: { enabled: false, message: "background sync is not configured" },
      expectedPath: "/sync/status",
      expectedQuery: {},
      run: (adapter) => adapter.getSyncStatus({}),
    },
  ];

  it.each(domainCases)("maps %s payloads and preserves route/query wiring", async (testCase) => {
    const request = vi.fn().mockResolvedValue(testCase.payload);
    const http: HttpClient = {
      get: vi.fn(),
      request,
    };

    const adapter = createEngramApiAdapter(http);
    await expect(testCase.run(adapter)).resolves.toEqual({
      kind: "success",
      data: testCase.expectedData,
    });

    expect(request).toHaveBeenCalledWith(testCase.expectedPath, {
      method: "GET",
      query: testCase.expectedQuery,
    });
  });

  type MalformedCase = {
    name: string;
    payload: unknown;
    expectedPath: string;
    run: ReturnType<typeof createEngramApiAdapter> extends infer TAdapter
      ? (adapter: TAdapter & ReturnType<typeof createEngramApiAdapter>) => Promise<unknown>
      : never;
  };

  const malformedCases: MalformedCase[] = [
    {
      name: "sessions.recent malformed payload",
      payload: {},
      expectedPath: "/sessions/recent",
      run: (adapter) => adapter.listRecentSessions({ project: "engram", limit: 5 }),
    },
    {
      name: "observations.recent malformed payload",
      payload: {},
      expectedPath: "/observations/recent",
      run: (adapter) => adapter.listRecentObservations({ project: "engram", scope: "project", limit: 5 }),
    },
    {
      name: "observations.getById malformed payload",
      payload: { id: "x" },
      expectedPath: "/observations/7",
      run: (adapter) => adapter.getObservationById({ id: 7 }),
    },
    {
      name: "search.query malformed payload",
      payload: {},
      expectedPath: "/search",
      run: (adapter) => adapter.searchQuery({ q: "engram", limit: 5, project: "engram", scope: "project" }),
    },
    {
      name: "timeline.list malformed payload",
      payload: { entries: {} },
      expectedPath: "/timeline",
      run: (adapter) => adapter.listTimeline({ observation_id: 7, before: 3, after: 5 }),
    },
    {
      name: "prompts.recent malformed payload",
      payload: {},
      expectedPath: "/prompts/recent",
      run: (adapter) => adapter.listRecentPrompts({ project: "engram", limit: 5 }),
    },
    {
      name: "prompts.search malformed payload",
      payload: {},
      expectedPath: "/prompts/search",
      run: (adapter) => adapter.searchPrompts({ q: "engram", project: "engram", limit: 5 }),
    },
    {
      name: "context.get malformed payload",
      payload: { context: 1 },
      expectedPath: "/context",
      run: (adapter) => adapter.getContext({ project: "engram", scope: "project" }),
    },
    {
      name: "export.get malformed payload",
      payload: { sessions: [], observations: [], prompts: {} },
      expectedPath: "/export",
      run: (adapter) => adapter.getExport({}),
    },
    {
      name: "stats.get malformed payload",
      payload: { total_sessions: 1 },
      expectedPath: "/stats",
      run: (adapter) => adapter.getStats({}),
    },
    {
      name: "sync.status malformed payload",
      payload: { enabled: true },
      expectedPath: "/sync/status",
      run: (adapter) => adapter.getSyncStatus({}),
    },
  ];

  it.each(malformedCases)("rejects %s with retryable failure", async (testCase) => {
    const request = vi.fn().mockResolvedValue(testCase.payload);
    const http: HttpClient = {
      get: vi.fn(),
      request,
    };

    const adapter = createEngramApiAdapter(http);
    const result = await testCase.run(adapter);

    expect(result).toMatchObject({
      kind: "retryable_failure",
      error: {
        code: "RETRYABLE_FAILURE",
        retryable: true,
      },
    });

    expect(request).toHaveBeenCalledWith(testCase.expectedPath, {
      method: "GET",
      query: expect.any(Object),
    });
  });

  it("propagates required-parameter validation failures for q, observation_id, and id", async () => {
    const http: HttpClient = {
      get: vi.fn(),
      request: vi.fn(),
    };

    const adapter = createEngramApiAdapter(http);

    await expect(adapter.searchQuery({ q: "", limit: 5 })).resolves.toMatchObject({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Search requires a non-empty query parameter 'q'",
      },
    });

    await expect(adapter.searchPrompts({ q: "", limit: 5 })).resolves.toMatchObject({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Prompts search requires a non-empty query parameter 'q'",
      },
    });

    await expect(adapter.listTimeline({ observation_id: 0, before: 3, after: 5 })).resolves.toMatchObject({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
      },
    });

    await expect(adapter.getObservationById({ id: 0 })).resolves.toMatchObject({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Observation detail requires a positive integer id",
      },
    });

    expect(http.request).not.toHaveBeenCalled();
  });

  it("maps memories compatibility method from observations endpoint", async () => {
    const http: HttpClient = {
      get: vi.fn(),
      request: vi.fn().mockResolvedValue([
        {
          id: 7,
          sync_id: "obs-sync-7",
          session_id: "sess-7",
          type: "architecture",
          title: "contract parity",
          project: "engram",
          scope: "project",
          topic_key: "parity/contracts",
          revision_count: 1,
          duplicate_count: 0,
          content: "contract parity",
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
      ]),
    };

    const adapter = createEngramApiAdapter(http);
    await expect(adapter.listMemories({ limit: 10, offset: 0 })).resolves.toEqual({
      kind: "success",
      data: {
        items: [{ id: "7", summary: "contract parity", createdAt: "2026-04-02T00:00:00Z" }],
      },
    });

    expect(http.request).toHaveBeenCalledWith("/observations/recent", {
      method: "GET",
      query: { limit: 10 },
    });
  });

  it("maps search compatibility params query->q and returns snippet from content", async () => {
    const request = vi.fn().mockResolvedValue([
      {
        id: 1,
        sync_id: "obs-sync-1",
        session_id: "sess-1",
        type: "bugfix",
        title: "found result",
        project: "engram",
        scope: "project",
        topic_key: "search/parity",
        revision_count: 1,
        duplicate_count: 0,
        content: "found result",
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
        rank: 0.99,
      },
    ]);

    const http: HttpClient = {
      get: vi.fn(),
      request,
    };

    const adapter = createEngramApiAdapter(http);
    await expect(adapter.search({ query: "engram", limit: 5 })).resolves.toEqual({
      kind: "success",
      data: {
        items: [{ id: "1", snippet: "found result" }],
      },
    });

    expect(request).toHaveBeenCalledWith("/search", {
      method: "GET",
      query: { q: "engram", limit: 5, project: undefined, scope: undefined },
    });
  });

  it("requires numeric observation id for timeline", async () => {
    const http: HttpClient = {
      get: vi.fn(),
      request: vi.fn(),
    };

    const adapter = createEngramApiAdapter(http);
    await expect(adapter.listTimelineLegacy({ observationId: "", limit: 10 })).resolves.toEqual({
      kind: "retryable_failure",
      error: {
        code: "VALIDATION_ERROR",
        message: "Timeline requires a positive integer observation_id",
        retryable: true,
      },
    });

    expect(http.request).not.toHaveBeenCalled();
  });

  it("maps sync status into settings compatibility payload", async () => {
    const http: HttpClient = {
      get: vi.fn(),
      request: vi.fn().mockResolvedValue({ enabled: true, phase: "healthy", consecutive_failures: 0 }),
    };

    const adapter = createEngramApiAdapter(http);
    await expect(adapter.getSettings({ profile: "default" })).resolves.toEqual({
      kind: "success",
      data: { theme: "sync-enabled" },
    });
  });

  it("maps transient transport failures to retryable_failure", async () => {
    const http: HttpClient = {
      get: vi.fn().mockRejectedValue(new HttpError("Server failure", 503)),
      request: vi.fn(),
    };
    const adapter = createEngramApiAdapter(http);

    await expect(adapter.health()).resolves.toEqual({
      kind: "retryable_failure",
      error: {
        code: "HTTP_503",
        message: "Server failure",
        retryable: true,
      },
    });
  });

});
