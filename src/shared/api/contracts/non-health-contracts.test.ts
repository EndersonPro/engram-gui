import { describe, expect, it } from "vitest";

import {
  decodeContextPayload,
  decodeErrorPayload,
  decodeExportPayload,
  decodeObservationPayload,
  decodeObservationsPayload,
  decodePromptsPayload,
  decodeSearchPayload,
  decodeSessionsPayload,
  decodeStatsPayload,
  decodeSyncStatusPayload,
  decodeTimelinePayload,
} from "@shared/api/contracts/non-health-types";
import {
  nonHealthContractKeys,
  nonHealthContracts,
  validateNonHealthContractShape,
} from "@shared/api/contracts/non-health-contracts";
import { HttpError } from "@shared/api/http";

describe("non-health contract parity registry", () => {
  it("registers all server-backed GET contract keys and excludes synthetic keys", () => {
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

  it("accepts parity contract entries as valid shapes", () => {
    const validation = validateNonHealthContractShape(nonHealthContracts["observations.getById"]);
    expect(validation).toEqual({ ok: true, issues: [] });
  });

  it("requires q and observation_id + path id inputs before request build", () => {
    expect(() => nonHealthContracts["search.query"].buildQuery({ q: "" })).toThrow(
      "Search requires a non-empty query parameter 'q'",
    );
    expect(() => nonHealthContracts["prompts.search"].buildQuery({ q: "" })).toThrow(
      "Prompts search requires a non-empty query parameter 'q'",
    );
    expect(() => nonHealthContracts["timeline.list"].buildQuery({ observation_id: 0 })).toThrow(
      "Timeline requires a positive integer observation_id",
    );
    expect(() => nonHealthContracts["observations.getById"].buildPath({ id: 0 })).toThrow(
      "Observation detail requires a positive integer id",
    );
  });

  it("preserves upstream 4xx status when mapping contract failures", () => {
    const failure = nonHealthContracts["search.query"].mapFailure(
      new HttpError("Request failed with status 400", 400),
    );

    expect(failure).toEqual({
      code: "HTTP_400",
      message: "Request failed with status 400",
      retryable: true,
    });
  });
});

describe("non-health server payload decoders", () => {
  it("decodes sessions, observations, and prompts payloads in snake_case", () => {
    expect(
      decodeSessionsPayload([
        {
          id: "sess-1",
          project: "engram",
          started_at: "2026-04-02T00:00:00Z",
          ended_at: "2026-04-02T01:00:00Z",
          summary: "Done",
          observation_count: 3,
        },
      ]),
    ).toEqual([
      {
        id: "sess-1",
        project: "engram",
        started_at: "2026-04-02T00:00:00Z",
        ended_at: "2026-04-02T01:00:00Z",
        summary: "Done",
        observation_count: 3,
      },
    ]);

    expect(
      decodeObservationsPayload([
        {
          id: 10,
          sync_id: "obs-sync-10",
          session_id: "sess-1",
          type: "architecture",
          title: "obs-title",
          project: "engram",
          scope: "project",
          topic_key: "obs/topic",
          revision_count: 2,
          duplicate_count: 1,
          updated_at: "2026-04-02T00:05:00Z",
          content: "obs",
          created_at: "2026-04-02T00:00:00Z",
        },
      ]),
    ).toEqual([
      {
        id: 10,
        sync_id: "obs-sync-10",
        session_id: "sess-1",
        type: "architecture",
        title: "obs-title",
        project: "engram",
        scope: "project",
        topic_key: "obs/topic",
        revision_count: 2,
        duplicate_count: 1,
        updated_at: "2026-04-02T00:05:00Z",
        content: "obs",
        created_at: "2026-04-02T00:00:00Z",
      },
    ]);

    expect(
      decodePromptsPayload([
        {
          id: 4,
          sync_id: "prompt-sync-4",
          session_id: "sess-1",
          project: "engram",
          content: "prompt",
          created_at: "2026-04-02T00:00:00Z",
        },
      ]),
    ).toEqual([
        {
          id: 4,
          sync_id: "prompt-sync-4",
          session_id: "sess-1",
          project: "engram",
          content: "prompt",
          created_at: "2026-04-02T00:00:00Z",
        },
    ]);
  });

  it("decodes detail/search/timeline/context/export/stats/sync payloads", () => {
    expect(
      decodeObservationPayload({
        id: 99,
        sync_id: "obs-sync-99",
        session_id: "sess-99",
        type: "bugfix",
        title: "obs detail",
        project: "engram",
        scope: "project",
        revision_count: 1,
        duplicate_count: 0,
        content: "obs detail",
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
      }),
    ).toEqual({
      id: 99,
      sync_id: "obs-sync-99",
      session_id: "sess-99",
      type: "bugfix",
      title: "obs detail",
      project: "engram",
      scope: "project",
      revision_count: 1,
      duplicate_count: 0,
      content: "obs detail",
      created_at: "2026-04-02T00:00:00Z",
      updated_at: "2026-04-02T00:00:00Z",
    });

    expect(
      decodeSearchPayload([
        {
          id: 12,
          sync_id: "obs-sync-12",
          session_id: "sess-12",
          type: "bugfix",
          title: "match-title",
          project: "engram",
          scope: "project",
          topic_key: "search/parity",
          revision_count: 1,
          duplicate_count: 0,
          content: "match",
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
          rank: 0.9,
        },
      ]),
    ).toEqual([
      {
        id: 12,
        sync_id: "obs-sync-12",
        session_id: "sess-12",
        type: "bugfix",
        title: "match-title",
        project: "engram",
        scope: "project",
        topic_key: "search/parity",
        revision_count: 1,
        duplicate_count: 0,
        content: "match",
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
        rank: 0.9,
      },
    ]);

    expect(
      decodeTimelinePayload({
        focus: {
          id: 12,
          sync_id: "obs-sync-12",
          session_id: "sess-12",
          type: "bugfix",
          title: "focus",
          project: "engram",
          scope: "project",
          content: "focus-content",
          revision_count: 1,
          duplicate_count: 0,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
        before: [],
        after: [],
        session_info: {
          id: "sess-12",
          project: "engram",
          directory: "/tmp/engram",
          started_at: "2026-04-02T00:00:00Z",
        },
        total_in_range: 1,
      }),
    ).toEqual({
      focus: {
        id: 12,
        sync_id: "obs-sync-12",
        session_id: "sess-12",
        type: "bugfix",
        title: "focus",
        project: "engram",
        scope: "project",
        content: "focus-content",
        revision_count: 1,
        duplicate_count: 0,
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
      },
      before: [],
      after: [],
      session_info: {
        id: "sess-12",
        project: "engram",
        directory: "/tmp/engram",
        started_at: "2026-04-02T00:00:00Z",
      },
      total_in_range: 1,
    });

    expect(
      decodeTimelinePayload({
        focus: {
          id: 12,
          sync_id: "obs-sync-12",
          session_id: "sess-12",
          type: "bugfix",
          title: "focus",
          project: "engram",
          scope: "project",
          content: "focus-content",
          revision_count: 1,
          duplicate_count: 0,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
        before: [
          {
            id: 11,
            session_id: "sess-12",
            type: "bugfix",
            title: "before",
            scope: "project",
            content: "before-content",
            revision_count: 1,
            duplicate_count: 0,
            is_focus: false,
            created_at: "2026-04-02T00:00:00Z",
            updated_at: "2026-04-02T00:00:00Z",
          },
        ],
        after: [
          {
            id: 13,
            session_id: "sess-12",
            type: "bugfix",
            title: "after",
            scope: "project",
            content: "after-content",
            revision_count: 1,
            duplicate_count: 0,
            is_focus: false,
            created_at: "2026-04-02T00:00:00Z",
            updated_at: "2026-04-02T00:00:00Z",
          },
        ],
        total_in_range: 3,
      }),
    ).toEqual({
      focus: {
        id: 12,
        sync_id: "obs-sync-12",
        session_id: "sess-12",
        type: "bugfix",
        title: "focus",
        project: "engram",
        scope: "project",
        content: "focus-content",
        revision_count: 1,
        duplicate_count: 0,
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
      },
      before: [
        {
          id: 11,
          sync_id: "timeline-11",
          session_id: "sess-12",
          type: "bugfix",
          title: "before",
          scope: "project",
          content: "before-content",
          revision_count: 1,
          duplicate_count: 0,
          is_focus: false,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
      ],
      after: [
        {
          id: 13,
          sync_id: "timeline-13",
          session_id: "sess-12",
          type: "bugfix",
          title: "after",
          scope: "project",
          content: "after-content",
          revision_count: 1,
          duplicate_count: 0,
          is_focus: false,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
      ],
      session_info: undefined,
      total_in_range: 3,
    });

    expect(decodeContextPayload({ context: "ctx" })).toEqual({ context: "ctx" });
    expect(
      decodeExportPayload({
        version: "0.1.0",
        exported_at: "2026-04-02T00:00:00Z",
        sessions: [],
        observations: [],
        prompts: [],
      }),
    ).toEqual({
      version: "0.1.0",
      exported_at: "2026-04-02T00:00:00Z",
      sessions: [],
      observations: [],
      prompts: [],
    });
    expect(
      decodeStatsPayload({
        total_sessions: 1,
        total_observations: 2,
        total_prompts: 3,
        projects: ["engram"],
      }),
    ).toEqual({
      total_sessions: 1,
      total_observations: 2,
      total_prompts: 3,
      projects: ["engram"],
    });

    expect(
      decodeSyncStatusPayload({
        enabled: true,
        phase: "healthy",
        last_error: "",
        consecutive_failures: 0,
      }),
    ).toEqual({
      enabled: true,
      phase: "healthy",
      last_error: "",
      consecutive_failures: 0,
    });
    expect(decodeSyncStatusPayload({ enabled: false, message: "disabled" })).toEqual({
      enabled: false,
      message: "disabled",
    });
  });

  it("keeps strict sync_id requirement outside timeline decoding", () => {
    expect(() =>
      decodeObservationPayload({
        id: 42,
        session_id: "sess-42",
        type: "architecture",
        title: "missing-sync",
        content: "missing-sync",
        scope: "project",
        revision_count: 1,
        duplicate_count: 0,
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
      }),
    ).toThrow("Observation payload.sync_id must be a string");
  });

  it("normalizes timeline before/after nullish values and still rejects invalid non-arrays", () => {
    expect(
      decodeTimelinePayload({
        focus: {
          id: 12,
          sync_id: "obs-sync-12",
          session_id: "sess-12",
          type: "bugfix",
          title: "focus",
          project: "engram",
          scope: "project",
          content: "focus-content",
          revision_count: 1,
          duplicate_count: 0,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
        before: null,
        after: undefined,
        total_in_range: 1,
      }),
    ).toEqual({
      focus: {
        id: 12,
        sync_id: "obs-sync-12",
        session_id: "sess-12",
        type: "bugfix",
        title: "focus",
        project: "engram",
        scope: "project",
        content: "focus-content",
        revision_count: 1,
        duplicate_count: 0,
        created_at: "2026-04-02T00:00:00Z",
        updated_at: "2026-04-02T00:00:00Z",
      },
      before: [],
      after: [],
      session_info: undefined,
      total_in_range: 1,
    });

    expect(() =>
      decodeTimelinePayload({
        focus: {
          id: 12,
          sync_id: "obs-sync-12",
          session_id: "sess-12",
          type: "bugfix",
          title: "focus",
          project: "engram",
          scope: "project",
          content: "focus-content",
          revision_count: 1,
          duplicate_count: 0,
          created_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
        before: [],
        after: {},
        total_in_range: 1,
      }),
    ).toThrow("Timeline payload.after must be an array");
  });

  it("decodes server error envelope and rejects malformed payloads", () => {
    expect(decodeErrorPayload({ error: "missing q" })).toEqual({ error: "missing q" });

    expect(() => decodeStatsPayload({ total_sessions: 1 })).toThrow("Stats payload.projects must be an array");
    expect(() => decodeSyncStatusPayload({ enabled: true })).toThrow(
      "Sync status payload.phase must be a string when enabled=true",
    );
  });
});
