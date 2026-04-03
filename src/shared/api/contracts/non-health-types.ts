export class ContractDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractDecodeError";
  }
}

export type ContractDecoder<T> = (payload: unknown) => T | null;

export interface SessionSummaryRaw {
  id: string;
  project: string;
  started_at: string;
  ended_at?: string;
  summary?: string;
  observation_count: number;
}

export interface SessionRaw {
  id: string;
  project: string;
  directory: string;
  started_at: string;
  ended_at?: string;
  summary?: string;
}

export interface ObservationRaw {
  id: number;
  sync_id: string;
  session_id: string;
  type: string;
  title: string;
  content: string;
  tool_name?: string;
  project?: string;
  scope: string;
  topic_key?: string;
  revision_count: number;
  duplicate_count: number;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SearchResultRaw extends ObservationRaw {
  rank: number;
}

export interface TimelineEntryRaw extends ObservationRaw {
  is_focus: boolean;
}

export interface TimelineResultRaw {
  focus: ObservationRaw;
  before: TimelineEntryRaw[];
  after: TimelineEntryRaw[];
  session_info?: SessionRaw;
  total_in_range: number;
}

export interface PromptRaw {
  id: number;
  sync_id: string;
  session_id: string;
  content: string;
  project?: string;
  created_at: string;
}

export interface ContextDto {
  context: string;
}

export interface ExportDataRaw {
  version: string;
  exported_at: string;
  sessions: SessionRaw[];
  observations: ObservationRaw[];
  prompts: PromptRaw[];
}

export interface StatsRaw {
  total_sessions: number;
  total_observations: number;
  total_prompts: number;
  projects: string[];
}

export type SyncStatusRaw =
  | {
      enabled: true;
      phase: string;
      last_error?: string;
      consecutive_failures: number;
      backoff_until?: string;
      last_sync_at?: string;
    }
  | {
      enabled: false;
      message: string;
    };

export interface ErrorEnvelope {
  error: string;
}

export interface SessionsRecentParams {
  project?: string;
  limit?: number;
}

export interface ObservationsRecentParams {
  project?: string;
  scope?: string;
  limit?: number;
}

export interface ObservationByIdParams {
  id: number;
}

export interface SearchQueryParams {
  q: string;
  project?: string;
  scope?: string;
  limit?: number;
}

export interface TimelineQueryParams {
  observation_id: number;
  before?: number;
  after?: number;
}

export interface PromptsRecentParams {
  project?: string;
  limit?: number;
}

export interface PromptsSearchParams {
  q: string;
  project?: string;
  limit?: number;
}

export interface ContextParams {
  project?: string;
  scope?: string;
}

export type ExportParams = Record<string, never>;
export type StatsParams = Record<string, never>;
export type SyncStatusParams = Record<string, never>;

// Compatibility types kept temporarily for pre-migration pages/hooks.
export interface MemoriesParams {
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
}

export interface TimelineParams {
  observationId: string;
  limit?: number;
}

export interface MemoryDto {
  id: string;
  summary: string;
  createdAt: string;
}

export interface MemoriesDto {
  items: MemoryDto[];
}

export interface SearchItemDto {
  id: string;
  snippet: string;
}

export interface SearchDto {
  items: SearchItemDto[];
}

export interface TimelineEntryDto {
  id: string;
  label: string;
  happenedAt: string;
  content?: string;
  type?: string;
  isFocus?: boolean;
}

export interface TimelineDto {
  entries: TimelineEntryDto[];
}

export interface SettingsParams {
  profile?: string;
}

export interface SettingsDto {
  theme: string;
}

const asRecord = (value: unknown, message: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractDecodeError(message);
  }

  return value as Record<string, unknown>;
};

const asArray = (value: unknown, message: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new ContractDecodeError(message);
  }

  return value;
};

const readString = (value: unknown, message: string): string => {
  if (typeof value !== "string") {
    throw new ContractDecodeError(message);
  }

  return value;
};

const readNumber = (value: unknown, message: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ContractDecodeError(message);
  }

  return value;
};

const readBoolean = (value: unknown, message: string): boolean => {
  if (typeof value !== "boolean") {
    throw new ContractDecodeError(message);
  }

  return value;
};

const readOptionalString = (value: unknown, message: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return readString(value, message);
};

const readTimelineSyncId = (
  value: unknown,
  fallbackObservationId: number,
  indexLabel: string,
): string => {
  if (value === undefined || value === null || value === "") {
    return `timeline-${fallbackObservationId}`;
  }

  return readString(value, `${indexLabel}.sync_id must be a string`);
};

const decodeSessionSummary = (payload: unknown, indexLabel: string): SessionSummaryRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);

  return {
    id: readString(record.id, `${indexLabel}.id must be a string`),
    project: readString(record.project, `${indexLabel}.project must be a string`),
    started_at: readString(record.started_at, `${indexLabel}.started_at must be a string`),
    ended_at: readOptionalString(record.ended_at, `${indexLabel}.ended_at must be a string when present`),
    summary: readOptionalString(record.summary, `${indexLabel}.summary must be a string when present`),
    observation_count: readNumber(
      record.observation_count,
      `${indexLabel}.observation_count must be a number`,
    ),
  };
};

const decodeSession = (payload: unknown, indexLabel: string): SessionRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);

  return {
    id: readString(record.id, `${indexLabel}.id must be a string`),
    project: readString(record.project, `${indexLabel}.project must be a string`),
    directory: readString(record.directory, `${indexLabel}.directory must be a string`),
    started_at: readString(record.started_at, `${indexLabel}.started_at must be a string`),
    ended_at: readOptionalString(record.ended_at, `${indexLabel}.ended_at must be a string when present`),
    summary: readOptionalString(record.summary, `${indexLabel}.summary must be a string when present`),
  };
};

const decodeObservation = (payload: unknown, indexLabel: string): ObservationRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);

  return {
    id: readNumber(record.id, `${indexLabel}.id must be a number`),
    sync_id: readString(record.sync_id, `${indexLabel}.sync_id must be a string`),
    session_id: readString(record.session_id, `${indexLabel}.session_id must be a string`),
    type: readString(record.type, `${indexLabel}.type must be a string`),
    title: readString(record.title, `${indexLabel}.title must be a string`),
    content: readString(record.content, `${indexLabel}.content must be a string`),
    tool_name: readOptionalString(record.tool_name, `${indexLabel}.tool_name must be a string when present`),
    project: readOptionalString(record.project, `${indexLabel}.project must be a string when present`),
    scope: readString(record.scope, `${indexLabel}.scope must be a string`),
    topic_key: readOptionalString(record.topic_key, `${indexLabel}.topic_key must be a string when present`),
    revision_count: readNumber(record.revision_count, `${indexLabel}.revision_count must be a number`),
    duplicate_count: readNumber(record.duplicate_count, `${indexLabel}.duplicate_count must be a number`),
    last_seen_at: readOptionalString(
      record.last_seen_at,
      `${indexLabel}.last_seen_at must be a string when present`,
    ),
    created_at: readString(record.created_at, `${indexLabel}.created_at must be a string`),
    updated_at: readString(record.updated_at, `${indexLabel}.updated_at must be a string`),
    deleted_at: readOptionalString(record.deleted_at, `${indexLabel}.deleted_at must be a string when present`),
  };
};

const decodeTimelineObservation = (payload: unknown, indexLabel: string): ObservationRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);
  const id = readNumber(record.id, `${indexLabel}.id must be a number`);

  return {
    id,
    sync_id: readTimelineSyncId(record.sync_id, id, indexLabel),
    session_id: readString(record.session_id, `${indexLabel}.session_id must be a string`),
    type: readString(record.type, `${indexLabel}.type must be a string`),
    title: readString(record.title, `${indexLabel}.title must be a string`),
    content: readString(record.content, `${indexLabel}.content must be a string`),
    tool_name: readOptionalString(record.tool_name, `${indexLabel}.tool_name must be a string when present`),
    project: readOptionalString(record.project, `${indexLabel}.project must be a string when present`),
    scope: readString(record.scope, `${indexLabel}.scope must be a string`),
    topic_key: readOptionalString(record.topic_key, `${indexLabel}.topic_key must be a string when present`),
    revision_count: readNumber(record.revision_count, `${indexLabel}.revision_count must be a number`),
    duplicate_count: readNumber(record.duplicate_count, `${indexLabel}.duplicate_count must be a number`),
    last_seen_at: readOptionalString(
      record.last_seen_at,
      `${indexLabel}.last_seen_at must be a string when present`,
    ),
    created_at: readString(record.created_at, `${indexLabel}.created_at must be a string`),
    updated_at: readString(record.updated_at, `${indexLabel}.updated_at must be a string`),
    deleted_at: readOptionalString(record.deleted_at, `${indexLabel}.deleted_at must be a string when present`),
  };
};

const decodeTimelineEntry = (payload: unknown, indexLabel: string): TimelineEntryRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);
  const observation = decodeTimelineObservation(record, indexLabel);

  return {
    ...observation,
    is_focus: readBoolean(record.is_focus, `${indexLabel}.is_focus must be a boolean`),
  };
};

const decodePrompt = (payload: unknown, indexLabel: string): PromptRaw => {
  const record = asRecord(payload, `${indexLabel} must be an object`);

  return {
    id: readNumber(record.id, `${indexLabel}.id must be a number`),
    sync_id: readString(record.sync_id, `${indexLabel}.sync_id must be a string`),
    session_id: readString(record.session_id, `${indexLabel}.session_id must be a string`),
    content: readString(record.content, `${indexLabel}.content must be a string`),
    project: readOptionalString(record.project, `${indexLabel}.project must be a string when present`),
    created_at: readString(record.created_at, `${indexLabel}.created_at must be a string`),
  };
};

export const decodeSessionsPayload: ContractDecoder<SessionSummaryRaw[]> = (payload) => {
  if (payload == null) {
    return null;
  }

  return asArray(payload, "Sessions payload must be an array").map((entry, index) =>
    decodeSessionSummary(entry, `Sessions payload[${index}]`),
  );
};

export const decodeObservationsPayload: ContractDecoder<ObservationRaw[]> = (payload) => {
  if (payload == null) {
    return null;
  }

  return asArray(payload, "Observations payload must be an array").map((entry, index) =>
    decodeObservation(entry, `Observations payload[${index}]`),
  );
};

export const decodeObservationPayload: ContractDecoder<ObservationRaw> = (payload) => {
  if (payload == null) {
    return null;
  }

  return decodeObservation(payload, "Observation payload");
};

export const decodePromptsPayload: ContractDecoder<PromptRaw[]> = (payload) => {
  if (payload == null) {
    return null;
  }

  return asArray(payload, "Prompts payload must be an array").map((entry, index) =>
    decodePrompt(entry, `Prompts payload[${index}]`),
  );
};

export const decodeSearchPayload: ContractDecoder<SearchResultRaw[]> = (payload) => {
  if (payload == null) {
    return null;
  }

  return asArray(payload, "Search payload must be an array").map((entry, index) => {
    const record = asRecord(entry, `Search payload[${index}] must be an object`);
    const observation = decodeObservation(record, `Search payload[${index}]`);

    return {
      ...observation,
      rank: readNumber(record.rank, `Search payload[${index}].rank must be a number`),
    };
  });
};

export const decodeTimelinePayload: ContractDecoder<TimelineResultRaw> = (payload) => {
  if (payload == null) {
    return null;
  }

  const readTimelineEntries = (value: unknown, field: "before" | "after"): TimelineEntryRaw[] => {
    if (value === null || value === undefined) {
      return [];
    }

    return asArray(value, `Timeline payload.${field} must be an array`).map((entry, index) =>
      decodeTimelineEntry(entry, `Timeline payload.${field}[${index}]`),
    );
  };

  const root = asRecord(payload, "Timeline payload must be an object");
  const before = readTimelineEntries(root.before, "before");
  const after = readTimelineEntries(root.after, "after");

  return {
    focus: decodeObservation(root.focus, "Timeline payload.focus"),
    before,
    after,
    session_info:
      root.session_info === undefined || root.session_info === null
        ? undefined
        : decodeSession(root.session_info, "Timeline payload.session_info"),
    total_in_range: readNumber(root.total_in_range, "Timeline payload.total_in_range must be a number"),
  };
};

export const decodeContextPayload: ContractDecoder<ContextDto> = (payload) => {
  if (payload == null) {
    return null;
  }

  const root = asRecord(payload, "Context payload must be an object");
  return {
    context: readString(root.context, "Context payload.context must be a string"),
  };
};

export const decodeExportPayload: ContractDecoder<ExportDataRaw> = (payload) => {
  if (payload == null) {
    return null;
  }

  const root = asRecord(payload, "Export payload must be an object");
  const sessions = asArray(root.sessions, "Export payload.sessions must be an array").map((entry, index) =>
    decodeSession(entry, `Export payload.sessions[${index}]`),
  );
  const observations = asArray(
    root.observations,
    "Export payload.observations must be an array",
  ).map((entry, index) => decodeObservation(entry, `Export payload.observations[${index}]`));
  const prompts = asArray(root.prompts, "Export payload.prompts must be an array").map((entry, index) =>
    decodePrompt(entry, `Export payload.prompts[${index}]`),
  );

  return {
    version: readString(root.version, "Export payload.version must be a string"),
    exported_at: readString(root.exported_at, "Export payload.exported_at must be a string"),
    sessions,
    observations,
    prompts,
  };
};

export const decodeStatsPayload: ContractDecoder<StatsRaw> = (payload) => {
  if (payload == null) {
    return null;
  }

  const root = asRecord(payload, "Stats payload must be an object");
  const projects = asArray(root.projects, "Stats payload.projects must be an array").map((entry, index) =>
    readString(entry, `Stats payload.projects[${index}] must be a string`),
  );

  return {
    total_sessions: readNumber(root.total_sessions, "Stats payload.total_sessions must be a number"),
    total_observations: readNumber(
      root.total_observations,
      "Stats payload.total_observations must be a number",
    ),
    total_prompts: readNumber(root.total_prompts, "Stats payload.total_prompts must be a number"),
    projects,
  };
};

export const decodeSyncStatusPayload: ContractDecoder<SyncStatusRaw> = (payload) => {
  if (payload == null) {
    return null;
  }

  const root = asRecord(payload, "Sync status payload must be an object");
  const enabled = readBoolean(root.enabled, "Sync status payload.enabled must be a boolean");

  if (!enabled) {
    return {
      enabled: false,
      message: readString(root.message, "Sync status payload.message must be a string when enabled=false"),
    };
  }

  return {
    enabled: true,
    phase: readString(root.phase, "Sync status payload.phase must be a string when enabled=true"),
    last_error: readOptionalString(root.last_error, "Sync status payload.last_error must be a string when present"),
    consecutive_failures: readNumber(
      root.consecutive_failures,
      "Sync status payload.consecutive_failures must be a number when enabled=true",
    ),
    backoff_until: readOptionalString(
      root.backoff_until,
      "Sync status payload.backoff_until must be a string when present",
    ),
    last_sync_at: readOptionalString(
      root.last_sync_at,
      "Sync status payload.last_sync_at must be a string when present",
    ),
  };
};

export const decodeErrorPayload: ContractDecoder<ErrorEnvelope> = (payload) => {
  if (payload == null) {
    return null;
  }

  const root = asRecord(payload, "Error payload must be an object");
  return {
    error: readString(root.error, "Error payload.error must be a string"),
  };
};
