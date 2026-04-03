export const queryKeys = {
  engram: {
    health: ["engram", "health"] as const,
    sessions: {
      recent: (params: { project?: string; limit?: number } = {}) =>
        ["engram", "sessions", "recent", params.project ?? null, params.limit ?? null] as const,
    },
    observations: {
      recent: (params: { project?: string; scope?: string; limit?: number } = {}) =>
        [
          "engram",
          "observations",
          "recent",
          params.project ?? null,
          params.scope ?? null,
          params.limit ?? null,
        ] as const,
      detail: (params: { id: number }) => ["engram", "observations", "detail", params.id] as const,
    },
    prompts: {
      recent: (params: { project?: string; limit?: number } = {}) =>
        ["engram", "prompts", "recent", params.project ?? null, params.limit ?? null] as const,
      search: (params: { q: string; project?: string; limit?: number }) =>
        ["engram", "prompts", "search", params.q, params.project ?? null, params.limit ?? null] as const,
    },
    search: {
      query: (params: { q: string; project?: string; scope?: string; limit?: number }) =>
        ["engram", "search", "query", params.q, params.project ?? null, params.scope ?? null, params.limit ?? null] as const,
    },
    timeline: {
      list: (params: { observation_id: number; before?: number; after?: number }) =>
        ["engram", "timeline", "list", params.observation_id, params.before ?? null, params.after ?? null] as const,
    },
    context: {
      get: (params: { project?: string; scope?: string } = {}) =>
        ["engram", "context", "get", params.project ?? null, params.scope ?? null] as const,
    },
    export: {
      get: ["engram", "export", "get"] as const,
    },
    stats: {
      get: ["engram", "stats", "get"] as const,
    },
    sync: {
      status: ["engram", "sync", "status"] as const,
    },
    settings: {
      overview: ["engram", "settings", "overview"] as const,
    },
  },
};
