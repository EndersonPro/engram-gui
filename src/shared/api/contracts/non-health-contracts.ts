import { HttpError, type HttpQueryParams, type HttpRequestMethod } from "@shared/api/http";
import type { RetryableFailure } from "@shared/types/adapter";

import {
  decodeContextPayload,
  decodeExportPayload,
  decodeObservationPayload,
  decodeObservationsPayload,
  decodePromptsPayload,
  decodeSearchPayload,
  decodeSessionsPayload,
  decodeStatsPayload,
  decodeSyncStatusPayload,
  decodeTimelinePayload,
  type ContextDto,
  type ContextParams,
  type ContractDecoder,
  type ExportDataRaw,
  type ExportParams,
  type ObservationByIdParams,
  type ObservationRaw,
  type ObservationsRecentParams,
  type PromptRaw,
  type PromptsRecentParams,
  type PromptsSearchParams,
  type SearchQueryParams,
  type SearchResultRaw,
  type SessionSummaryRaw,
  type SessionsRecentParams,
  type StatsParams,
  type StatsRaw,
  type SyncStatusParams,
  type SyncStatusRaw,
  type TimelineQueryParams,
  type TimelineResultRaw,
} from "@shared/api/contracts/non-health-types";

export type NonHealthContractKey =
  | "sessions.recent"
  | "observations.recent"
  | "observations.getById"
  | "search.query"
  | "timeline.list"
  | "prompts.recent"
  | "prompts.search"
  | "context.get"
  | "export.get"
  | "stats.get"
  | "sync.status";

export interface NonHealthContractEntry<TParams, TDto> {
  method: HttpRequestMethod;
  path: string;
  params: readonly (keyof TParams)[];
  buildPath: (params: TParams) => string;
  buildQuery: (params: TParams) => HttpQueryParams;
  decode: ContractDecoder<TDto>;
  mapFailure: (error: unknown) => RetryableFailure;
}

export interface ContractShapeValidation {
  ok: boolean;
  issues: string[];
}

type NonHealthContractMap = {
  "sessions.recent": NonHealthContractEntry<SessionsRecentParams, SessionSummaryRaw[]>;
  "observations.recent": NonHealthContractEntry<ObservationsRecentParams, ObservationRaw[]>;
  "observations.getById": NonHealthContractEntry<ObservationByIdParams, ObservationRaw>;
  "search.query": NonHealthContractEntry<SearchQueryParams, SearchResultRaw[]>;
  "timeline.list": NonHealthContractEntry<TimelineQueryParams, TimelineResultRaw>;
  "prompts.recent": NonHealthContractEntry<PromptsRecentParams, PromptRaw[]>;
  "prompts.search": NonHealthContractEntry<PromptsSearchParams, PromptRaw[]>;
  "context.get": NonHealthContractEntry<ContextParams, ContextDto>;
  "export.get": NonHealthContractEntry<ExportParams, ExportDataRaw>;
  "stats.get": NonHealthContractEntry<StatsParams, StatsRaw>;
  "sync.status": NonHealthContractEntry<SyncStatusParams, SyncStatusRaw>;
};

class ContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractValidationError";
  }
}

const toQuery = <TParams extends object>(params: TParams): HttpQueryParams => {
  return params as HttpQueryParams;
};

const requireNonEmpty = (value: string, message: string): string => {
  if (!value.trim()) {
    throw new ContractValidationError(message);
  }

  return value;
};

const requirePositiveInteger = (value: number, message: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ContractValidationError(message);
  }

  return value;
};

const mapRetryableFailure = (error: unknown): RetryableFailure => {
  if (error instanceof HttpError && typeof error.status === "number") {
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

  if (error instanceof ContractValidationError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.message,
      retryable: true,
    };
  }

  if (error instanceof Error) {
    return {
      code: "RETRYABLE_FAILURE",
      message: error.message,
      retryable: true,
    };
  }

  return {
    code: "RETRYABLE_FAILURE",
    message: "Unknown retryable failure",
    retryable: true,
  };
};

export const nonHealthContracts: NonHealthContractMap = {
  "sessions.recent": {
    method: "GET",
    path: "/sessions/recent",
    params: ["project", "limit"],
    buildPath: () => "/sessions/recent",
    buildQuery: (params) => toQuery(params),
    decode: decodeSessionsPayload,
    mapFailure: mapRetryableFailure,
  },
  "observations.recent": {
    method: "GET",
    path: "/observations/recent",
    params: ["project", "scope", "limit"],
    buildPath: () => "/observations/recent",
    buildQuery: (params) => toQuery(params),
    decode: decodeObservationsPayload,
    mapFailure: mapRetryableFailure,
  },
  "observations.getById": {
    method: "GET",
    path: "/observations/{id}",
    params: ["id"],
    buildPath: (params) => {
      const id = requirePositiveInteger(params.id, "Observation detail requires a positive integer id");
      return `/observations/${id}`;
    },
    buildQuery: () => ({}),
    decode: decodeObservationPayload,
    mapFailure: mapRetryableFailure,
  },
  "search.query": {
    method: "GET",
    path: "/search",
    params: ["q", "project", "scope", "limit"],
    buildPath: () => "/search",
    buildQuery: (params) => ({
      q: requireNonEmpty(params.q, "Search requires a non-empty query parameter 'q'"),
      project: params.project,
      scope: params.scope,
      limit: params.limit,
    }),
    decode: decodeSearchPayload,
    mapFailure: mapRetryableFailure,
  },
  "timeline.list": {
    method: "GET",
    path: "/timeline",
    params: ["observation_id", "before", "after"],
    buildPath: () => "/timeline",
    buildQuery: (params) => ({
      observation_id: requirePositiveInteger(
        params.observation_id,
        "Timeline requires a positive integer observation_id",
      ),
      before: params.before,
      after: params.after,
    }),
    decode: decodeTimelinePayload,
    mapFailure: mapRetryableFailure,
  },
  "prompts.recent": {
    method: "GET",
    path: "/prompts/recent",
    params: ["project", "limit"],
    buildPath: () => "/prompts/recent",
    buildQuery: (params) => toQuery(params),
    decode: decodePromptsPayload,
    mapFailure: mapRetryableFailure,
  },
  "prompts.search": {
    method: "GET",
    path: "/prompts/search",
    params: ["q", "project", "limit"],
    buildPath: () => "/prompts/search",
    buildQuery: (params) => ({
      q: requireNonEmpty(params.q, "Prompts search requires a non-empty query parameter 'q'"),
      project: params.project,
      limit: params.limit,
    }),
    decode: decodePromptsPayload,
    mapFailure: mapRetryableFailure,
  },
  "context.get": {
    method: "GET",
    path: "/context",
    params: ["project", "scope"],
    buildPath: () => "/context",
    buildQuery: (params) => toQuery(params),
    decode: decodeContextPayload,
    mapFailure: mapRetryableFailure,
  },
  "export.get": {
    method: "GET",
    path: "/export",
    params: [],
    buildPath: () => "/export",
    buildQuery: () => ({}),
    decode: decodeExportPayload,
    mapFailure: mapRetryableFailure,
  },
  "stats.get": {
    method: "GET",
    path: "/stats",
    params: [],
    buildPath: () => "/stats",
    buildQuery: () => ({}),
    decode: decodeStatsPayload,
    mapFailure: mapRetryableFailure,
  },
  "sync.status": {
    method: "GET",
    path: "/sync/status",
    params: [],
    buildPath: () => "/sync/status",
    buildQuery: () => ({}),
    decode: decodeSyncStatusPayload,
    mapFailure: mapRetryableFailure,
  },
};

export const validateNonHealthContractShape = (entry: unknown): ContractShapeValidation => {
  const issues: string[] = [];

  if (!entry || typeof entry !== "object") {
    return {
      ok: false,
      issues: ["contract entry must be an object"],
    };
  }

  const contract = entry as Partial<NonHealthContractEntry<object, unknown>>;

  if (contract.method !== "GET") {
    issues.push("method must be GET");
  }

  if (typeof contract.path !== "string" || !contract.path.startsWith("/")) {
    issues.push("path must be an absolute route string");
  }

  if (!Array.isArray(contract.params)) {
    issues.push("params must be an array");
  }

  if (typeof contract.buildPath !== "function") {
    issues.push("buildPath must be a function");
  }

  if (typeof contract.buildQuery !== "function") {
    issues.push("buildQuery must be a function");
  }

  if (typeof contract.decode !== "function") {
    issues.push("decode must be a function");
  }

  if (typeof contract.mapFailure !== "function") {
    issues.push("mapFailure must be a function");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

export const nonHealthContractKeys = Object.freeze(
  Object.keys(nonHealthContracts) as NonHealthContractKey[],
);
