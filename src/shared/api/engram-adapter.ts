import type { AdapterResult, RetryableFailure } from "@shared/types/adapter";
import type { HealthStatusDto } from "@shared/types/runtime";
import { HttpError, type HttpClient, createTauriProxyHttpClient } from "@shared/api/http";
import {
  nonHealthContracts,
  type NonHealthContractEntry,
} from "@shared/api/contracts/non-health-contracts";
import type {
  ContextDto,
  ContextParams,
  ExportDataRaw,
  ExportParams,
  ObservationByIdParams,
  ObservationRaw,
  ObservationsRecentParams,
  MemoriesDto,
  MemoriesParams,
  PromptRaw,
  PromptsRecentParams,
  PromptsSearchParams,
  SearchResultRaw,
  SearchQueryParams,
  SearchDto,
  SearchParams,
  SessionRaw,
  SessionSummaryRaw,
  SessionsRecentParams,
  SettingsDto,
  SettingsParams,
  StatsParams,
  StatsRaw,
  SyncStatusParams,
  SyncStatusRaw,
  TimelineEntryRaw,
  TimelineQueryParams,
  TimelineResultRaw,
  TimelineDto,
  TimelineParams,
} from "@shared/api/contracts/non-health-types";

export interface SessionSummaryDto {
  id: string;
  project: string;
  startedAt: string;
  endedAt?: string;
  summary?: string;
  observationCount: number;
}

export interface SessionDto {
  id: string;
  project: string;
  directory: string;
  startedAt: string;
  endedAt?: string;
  summary?: string;
}

export interface ObservationDto {
  id: number;
  syncId: string;
  sessionId: string;
  type: string;
  title: string;
  content: string;
  toolName?: string;
  project?: string;
  scope: string;
  topicKey?: string;
  revisionCount: number;
  duplicateCount: number;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PromptDto {
  id: number;
  syncId: string;
  sessionId: string;
  content: string;
  project?: string;
  createdAt: string;
}

export interface SearchResultDto {
  rank: number;
  observation: ObservationDto;
}

export interface TimelineEntryDto extends ObservationDto {
  isFocus: boolean;
}

export interface TimelineResultDto {
  focus: ObservationDto;
  before: TimelineEntryDto[];
  after: TimelineEntryDto[];
  sessionInfo?: SessionDto;
  totalInRange: number;
}

export interface ExportDataDto {
  version: string;
  exportedAt: string;
  sessions: SessionDto[];
  observations: ObservationDto[];
  prompts: PromptDto[];
}

export interface StatsDto {
  totalSessions: number;
  totalObservations: number;
  totalPrompts: number;
  projects: string[];
}

export type SyncStatusDto = SyncStatusRaw;

export interface EngramApiAdapter {
  health(): Promise<AdapterResult<HealthStatusDto | null, RetryableFailure>>;
  listRecentSessions(
    params: SessionsRecentParams,
  ): Promise<AdapterResult<SessionSummaryDto[] | null, RetryableFailure>>;
  listRecentObservations(
    params: ObservationsRecentParams,
  ): Promise<AdapterResult<ObservationDto[] | null, RetryableFailure>>;
  getObservationById(
    params: ObservationByIdParams,
  ): Promise<AdapterResult<ObservationDto | null, RetryableFailure>>;
  searchQuery(params: SearchQueryParams): Promise<AdapterResult<SearchResultDto[] | null, RetryableFailure>>;
  listMemories(params: MemoriesParams): Promise<AdapterResult<MemoriesDto | null, RetryableFailure>>;
  search(params: SearchParams): Promise<AdapterResult<SearchDto | null, RetryableFailure>>;
  listTimeline(params: TimelineQueryParams): Promise<AdapterResult<TimelineResultDto | null, RetryableFailure>>;
  listTimelineLegacy(params: TimelineParams): Promise<AdapterResult<TimelineDto | null, RetryableFailure>>;
  listRecentPrompts(params: PromptsRecentParams): Promise<AdapterResult<PromptDto[] | null, RetryableFailure>>;
  searchPrompts(params: PromptsSearchParams): Promise<AdapterResult<PromptDto[] | null, RetryableFailure>>;
  getContext(params: ContextParams): Promise<AdapterResult<ContextDto | null, RetryableFailure>>;
  getExport(params: ExportParams): Promise<AdapterResult<ExportDataDto | null, RetryableFailure>>;
  getStats(params: StatsParams): Promise<AdapterResult<StatsDto | null, RetryableFailure>>;
  getSyncStatus(params: SyncStatusParams): Promise<AdapterResult<SyncStatusDto | null, RetryableFailure>>;
  getSettings(params: SettingsParams): Promise<AdapterResult<SettingsDto | null, RetryableFailure>>;
}

export const normalizeHealthPayload = (
  payload: HealthStatusDto | null | undefined,
): AdapterResult<HealthStatusDto | null, RetryableFailure> => {
  if (!payload) {
    return { kind: "empty", data: null };
  }

  return { kind: "success", data: payload };
};

const mapRetryableFailure = (error: unknown): RetryableFailure => {
  if (error instanceof HttpError && (error.status ?? 0) >= 500) {
    return {
      code: `HTTP_${error.status}`,
      message: error.message,
      retryable: true,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: "NETWORK_ERROR",
      message: error.message,
      retryable: true,
    };
  }

  return {
    code: "RETRYABLE_FAILURE",
    message: error instanceof Error ? error.message : "Unknown retryable failure",
    retryable: true,
  };
};

const runNonHealthContract = async <TParams, TDto>(
  http: HttpClient,
  contract: NonHealthContractEntry<TParams, TDto>,
  params: TParams,
): Promise<AdapterResult<TDto | null, RetryableFailure>> => {
  try {
    const payload = await http.request<unknown>(contract.buildPath(params), {
      method: contract.method,
      query: contract.buildQuery(params),
    });

    const decoded = contract.decode(payload);

    if (!decoded) {
      return {
        kind: "empty",
        data: null,
      };
    }

    return {
      kind: "success",
      data: decoded,
    };
  } catch (error) {
    return {
      kind: "retryable_failure",
      error: contract.mapFailure(error),
    };
  }
};

const mapSessionSummaryToDomain = (session: SessionSummaryRaw): SessionSummaryDto => ({
  id: session.id,
  project: session.project,
  startedAt: session.started_at,
  endedAt: session.ended_at,
  summary: session.summary,
  observationCount: session.observation_count,
});

const mapSessionToDomain = (session: SessionRaw): SessionDto => ({
  id: session.id,
  project: session.project,
  directory: session.directory,
  startedAt: session.started_at,
  endedAt: session.ended_at,
  summary: session.summary,
});

const mapObservationToDomain = (observation: ObservationRaw): ObservationDto => ({
  id: observation.id,
  syncId: observation.sync_id,
  sessionId: observation.session_id,
  type: observation.type,
  title: observation.title,
  content: observation.content,
  toolName: observation.tool_name,
  project: observation.project,
  scope: observation.scope,
  topicKey: observation.topic_key,
  revisionCount: observation.revision_count,
  duplicateCount: observation.duplicate_count,
  lastSeenAt: observation.last_seen_at,
  createdAt: observation.created_at,
  updatedAt: observation.updated_at,
  deletedAt: observation.deleted_at,
});

const mapPromptToDomain = (prompt: PromptRaw): PromptDto => ({
  id: prompt.id,
  syncId: prompt.sync_id,
  sessionId: prompt.session_id,
  content: prompt.content,
  project: prompt.project,
  createdAt: prompt.created_at,
});

const mapSearchResultToDomain = (result: SearchResultRaw): SearchResultDto => ({
  rank: result.rank,
  observation: mapObservationToDomain(result),
});

const mapTimelineEntryToDomain = (entry: TimelineEntryRaw): TimelineEntryDto => ({
  ...mapObservationToDomain(entry),
  isFocus: entry.is_focus,
});

const mapTimelineToDomain = (result: TimelineResultRaw): TimelineResultDto => ({
  focus: mapObservationToDomain(result.focus),
  before: result.before.map(mapTimelineEntryToDomain),
  after: result.after.map(mapTimelineEntryToDomain),
  sessionInfo: result.session_info ? mapSessionToDomain(result.session_info) : undefined,
  totalInRange: result.total_in_range,
});

const mapExportToDomain = (result: ExportDataRaw): ExportDataDto => ({
  version: result.version,
  exportedAt: result.exported_at,
  sessions: result.sessions.map(mapSessionToDomain),
  observations: result.observations.map(mapObservationToDomain),
  prompts: result.prompts.map(mapPromptToDomain),
});

const mapStatsToDomain = (stats: StatsRaw): StatsDto => ({
  totalSessions: stats.total_sessions,
  totalObservations: stats.total_observations,
  totalPrompts: stats.total_prompts,
  projects: stats.projects,
});

const mapSuccess = <TInput, TOutput>(
  result: AdapterResult<TInput | null, RetryableFailure>,
  mapper: (input: TInput) => TOutput,
): AdapterResult<TOutput | null, RetryableFailure> => {
  if (result.kind === "retryable_failure") {
    return result;
  }

  if (result.kind === "empty" || result.data === null) {
    return { kind: "empty", data: null };
  }

  return {
    kind: "success",
    data: mapper(result.data),
  };
};

export const createEngramApiAdapter = (http: HttpClient): EngramApiAdapter => ({
  async health() {
    try {
      const payload = await http.get<HealthStatusDto | null>("/health");
      return normalizeHealthPayload(payload);
    } catch (error) {
      return {
        kind: "retryable_failure",
        error: mapRetryableFailure(error),
      };
    }
  },
  listRecentSessions(params) {
    return runNonHealthContract(http, nonHealthContracts["sessions.recent"], params).then((result) =>
      mapSuccess(result, (sessions) => sessions.map(mapSessionSummaryToDomain)),
    );
  },
  listRecentObservations(params) {
    return runNonHealthContract(http, nonHealthContracts["observations.recent"], params).then((result) =>
      mapSuccess(result, (observations) => observations.map(mapObservationToDomain)),
    );
  },
  getObservationById(params) {
    return runNonHealthContract(http, nonHealthContracts["observations.getById"], params).then((result) =>
      mapSuccess(result, mapObservationToDomain),
    );
  },
  searchQuery(params) {
    return runNonHealthContract(http, nonHealthContracts["search.query"], params).then((result) =>
      mapSuccess(result, (entries) => entries.map(mapSearchResultToDomain)),
    );
  },
  listMemories(params) {
    return runNonHealthContract(http, nonHealthContracts["observations.recent"], {
      project: undefined,
      scope: undefined,
      limit: params.limit,
    }).then((result): AdapterResult<MemoriesDto | null, RetryableFailure> => {
      return mapSuccess(result, (observations) => ({
        items: observations.map((observation) => ({
          id: String(observation.id),
          summary: observation.content,
          createdAt: observation.created_at,
        })),
      }));
    });
  },
  search(params) {
    return runNonHealthContract(http, nonHealthContracts["search.query"], {
      q: params.query,
      limit: params.limit,
      project: undefined,
      scope: undefined,
    }).then((result) =>
      mapSuccess(result, (entries) => ({
        items: entries.map((entry) => ({
          id: String(entry.id),
          snippet: entry.content,
        })),
      })),
    );
  },
  listTimeline(params) {
    return runNonHealthContract(http, nonHealthContracts["timeline.list"], params).then((result) =>
      mapSuccess(result, mapTimelineToDomain),
    );
  },
  listTimelineLegacy(params) {
    return runNonHealthContract(http, nonHealthContracts["timeline.list"], {
      observation_id: Number.parseInt(params.observationId, 10),
      before: undefined,
      after: params.limit,
    }).then((result) =>
      mapSuccess(result, (timeline) => ({
        entries: [...timeline.before, { ...timeline.focus, isFocus: true }, ...timeline.after].map((entry, index) => ({
          id: `timeline-${index}`,
          label: JSON.stringify(entry),
          happenedAt: "",
        })),
      })),
    );
  },
  listRecentPrompts(params) {
    return runNonHealthContract(http, nonHealthContracts["prompts.recent"], params).then((result) =>
      mapSuccess(result, (prompts) => prompts.map(mapPromptToDomain)),
    );
  },
  searchPrompts(params) {
    return runNonHealthContract(http, nonHealthContracts["prompts.search"], params).then((result) =>
      mapSuccess(result, (prompts) => prompts.map(mapPromptToDomain)),
    );
  },
  getContext(params) {
    return runNonHealthContract(http, nonHealthContracts["context.get"], params);
  },
  getExport(params) {
    return runNonHealthContract(http, nonHealthContracts["export.get"], params).then((result) =>
      mapSuccess(result, mapExportToDomain),
    );
  },
  getStats(params) {
    return runNonHealthContract(http, nonHealthContracts["stats.get"], params).then((result) =>
      mapSuccess(result, mapStatsToDomain),
    );
  },
  getSyncStatus(params) {
    return runNonHealthContract(http, nonHealthContracts["sync.status"], params);
  },
  getSettings(_params) {
    return runNonHealthContract(http, nonHealthContracts["sync.status"], {}).then(
      (result): AdapterResult<SettingsDto | null, RetryableFailure> => {
        return mapSuccess(result, (status: SyncStatusRaw) => ({
          theme: status.enabled ? "sync-enabled" : "sync-disabled",
        }));
      },
    );
  },
});

export const engramApiAdapter = createEngramApiAdapter(createTauriProxyHttpClient());
