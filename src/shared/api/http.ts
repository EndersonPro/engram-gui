import { invoke } from "@tauri-apps/api/core";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type HttpRequestMethod = "GET";

export type HttpQueryParams = Record<string, string | number | boolean | undefined>;

export interface HttpRequestOptions extends Omit<RequestInit, "method"> {
  method: HttpRequestMethod;
  query?: HttpQueryParams;
}

export interface HttpClient {
  request<T>(path: string, options: HttpRequestOptions): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
}

export type ProxyRoute =
  | "health"
  | "sessions.recent"
  | "observations.recent"
  | "search.query"
  | "timeline.list"
  | "observations.getById"
  | "prompts.recent"
  | "prompts.search"
  | "context.get"
  | "export.get"
  | "stats.get"
  | "sync.status";

export interface ProxyRequest {
  route: ProxyRoute;
  query?: Record<string, string | number | boolean>;
  pathParams?: {
    id: number;
  };
}

interface ProxyResponse {
  status: number;
  body: unknown;
}

const routeByPath: Record<string, ProxyRoute> = {
  "/health": "health",
  "/sessions/recent": "sessions.recent",
  "/observations/recent": "observations.recent",
  "/search": "search.query",
  "/timeline": "timeline.list",
  "/prompts/recent": "prompts.recent",
  "/prompts/search": "prompts.search",
  "/context": "context.get",
  "/export": "export.get",
  "/stats": "stats.get",
  "/sync/status": "sync.status",
};

const observationsByIdPath = /^\/observations\/(\d+)$/;

const toProxyRequest = (path: string, query?: HttpQueryParams): ProxyRequest => {
  const detailMatch = observationsByIdPath.exec(path);
  if (detailMatch) {
    const id = Number.parseInt(detailMatch[1], 10);
    if (!Number.isInteger(id)) {
      throw new HttpError(`Unsupported proxy route: ${path}`);
    }

    return {
      route: "observations.getById",
      pathParams: { id },
    };
  }

  const route = routeByPath[path];
  if (!route) {
    throw new HttpError(`Unsupported proxy route: ${path}`);
  }

  const normalizedQuery = Object.fromEntries(
    Object.entries(query ?? {}).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;

  return {
    route,
    query: Object.keys(normalizedQuery).length > 0 ? normalizedQuery : undefined,
  };
};

export const createHttpClient = (baseUrl: string): HttpClient => ({
  async request<T>(path: string, options: HttpRequestOptions) {
    const url = new URL(path, baseUrl);
    const queryEntries = Object.entries(options.query ?? {}).filter(([, value]) => value !== undefined);

    for (const [key, value] of queryEntries) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString(), {
      ...options,
      method: options.method,
      headers: {
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new HttpError(`Request failed with status ${response.status}`, response.status);
    }

    return (await response.json()) as T;
  },
  async get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "GET",
    });
  },
});

export const createTauriProxyHttpClient = (): HttpClient => ({
  async request<T>(path: string, options: HttpRequestOptions) {
    const request = toProxyRequest(path, options.query);
    const response = await invoke<ProxyResponse>("proxy_engram_get", {
      request,
    });

    if (response.status >= 400) {
      throw new HttpError(`Request failed with status ${response.status}`, response.status);
    }

    return response.body as T;
  },
  async get<T>(path: string) {
    return this.request<T>(path, {
      method: "GET",
    });
  },
});
