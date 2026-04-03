import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type EndpointFamily =
  | "health"
  | "sessions"
  | "observations"
  | "prompts"
  | "search_timeline_context"
  | "export"
  | "stats_sync";

interface ParityProbe {
  family: EndpointFamily;
  path: string;
  query: Record<string, string | number | boolean | undefined>;
}

export interface EndpointVerificationResult {
  route: string;
  statusCode: number;
  result: "PASS" | "FAIL";
  detail: string;
}

export interface FamilyVerificationResult {
  family: EndpointFamily;
  pass: number;
  fail: number;
  endpoints: EndpointVerificationResult[];
}

export interface ParityMatrixReport {
  generatedAt: string;
  runtimeBaseUrl: string;
  summary: {
    pass: number;
    fail: number;
  };
  families: FamilyVerificationResult[];
}

interface ParityMatrixPlan {
  runtimeBaseUrl: string;
  probes: ParityProbe[];
}

type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

const DEFAULT_RUNTIME_BASE_URL = "http://127.0.0.1:7437";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/u, "");

const toRoute = (probe: ParityProbe): string => {
  const params = new URLSearchParams();

  for (const [key, raw] of Object.entries(probe.query)) {
    if (raw !== undefined) {
      params.set(key, String(raw));
    }
  }

  const query = params.toString();
  return query.length > 0 ? `${probe.path}?${query}` : probe.path;
};

const responseDetail = (status: number, body: string): string => {
  const trimmed = body.trim();

  if (trimmed.length === 0) {
    return `HTTP ${status}`;
  }

  const preview = trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
  return `HTTP ${status} :: ${preview}`;
};

const createEndpointResult = async (
  runtimeBaseUrl: string,
  probe: ParityProbe,
  fetcher: Fetcher,
): Promise<EndpointVerificationResult> => {
  const route = toRoute(probe);
  const endpoint = `${runtimeBaseUrl}${route}`;

  try {
    const response = await fetcher(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
    const body = await response.text();

    return {
      route,
      statusCode: response.status,
      result: response.ok ? "PASS" : "FAIL",
      detail: responseDetail(response.status, body),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown runtime request failure";

    return {
      route,
      statusCode: 0,
      result: "FAIL",
      detail: `NETWORK_ERROR :: ${message}`,
    };
  }
};

const summarizeByFamily = (probes: ParityProbe[], endpointResults: EndpointVerificationResult[]): FamilyVerificationResult[] => {
  const familiesInOrder: EndpointFamily[] = [
    "health",
    "sessions",
    "observations",
    "prompts",
    "search_timeline_context",
    "export",
    "stats_sync",
  ];

  return familiesInOrder.map((family) => {
    const familyRoutes = probes.filter((probe) => probe.family === family).map(toRoute);
    const endpoints = endpointResults.filter((result) => familyRoutes.includes(result.route));
    const pass = endpoints.filter((result) => result.result === "PASS").length;
    const fail = endpoints.filter((result) => result.result === "FAIL").length;

    return {
      family,
      pass,
      fail,
      endpoints,
    };
  });
};

export const createParityMatrixPlan = (runtimeBaseUrl: string): ParityMatrixPlan => {
  const baseUrl = trimTrailingSlash(runtimeBaseUrl);

  return {
    runtimeBaseUrl: baseUrl,
    probes: [
      { family: "health", path: "/health", query: {} },
      { family: "sessions", path: "/sessions/recent", query: { limit: 1 } },
      { family: "observations", path: "/observations/recent", query: { limit: 1 } },
      { family: "observations", path: "/observations/1", query: {} },
      { family: "prompts", path: "/prompts/recent", query: { limit: 1 } },
      { family: "prompts", path: "/prompts/search", query: { q: "engram-gui", limit: 1 } },
      { family: "search_timeline_context", path: "/search", query: { q: "engram-gui", limit: 1 } },
      { family: "search_timeline_context", path: "/timeline", query: { observation_id: 1, after: 5 } },
      { family: "search_timeline_context", path: "/context", query: { scope: "project" } },
      { family: "export", path: "/export", query: {} },
      { family: "stats_sync", path: "/stats", query: {} },
      { family: "stats_sync", path: "/sync/status", query: {} },
    ],
  };
};

export const verifyParityMatrix = async (
  plan: ParityMatrixPlan,
  fetcher: Fetcher = fetch,
): Promise<ParityMatrixReport> => {
  const endpointResults: EndpointVerificationResult[] = [];

  for (const probe of plan.probes) {
    endpointResults.push(await createEndpointResult(plan.runtimeBaseUrl, probe, fetcher));
  }

  const families = summarizeByFamily(plan.probes, endpointResults);
  const summary = {
    pass: endpointResults.filter((result) => result.result === "PASS").length,
    fail: endpointResults.filter((result) => result.result === "FAIL").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl: plan.runtimeBaseUrl,
    summary,
    families,
  };
};

export const renderParityMatrixEvidence = (report: ParityMatrixReport): string => {
  const familyRows = report.families
    .map((family) => `| ${family.family} | ${family.pass} | ${family.fail} |`)
    .join("\n");

  const endpointRows = report.families
    .flatMap((family) =>
      family.endpoints.map(
        (endpoint) =>
          `| ${family.family} | ${endpoint.route} | ${endpoint.result} | ${endpoint.statusCode} | ${endpoint.detail} |`,
      ),
    )
    .join("\n");

  return [
    "# GET Parity Matrix Evidence",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Runtime base URL: ${report.runtimeBaseUrl}`,
    `- Summary: ${report.summary.pass} PASS / ${report.summary.fail} FAIL`,
    "",
    "## Family Summary",
    "",
    "| Family | PASS | FAIL |",
    "|---|---:|---:|",
    familyRows,
    "",
    "## Endpoint Results",
    "",
    "| Family | Route | Result | HTTP | Detail |",
    "|---|---|---|---:|---|",
    endpointRows,
    "",
  ].join("\n");
};

interface RuntimeVerificationInput {
  runtimeBaseUrl?: string;
  outputFilePath?: string;
  configFilePath?: string;
  fetcher?: Fetcher;
}

const parseConfiguredBaseUrl = (content: string): string | null => {
  try {
    const parsed = JSON.parse(content) as {
      apiBaseUrl?: unknown;
      healthUrl?: unknown;
      health_url?: unknown;
    };

    if (typeof parsed.apiBaseUrl === "string" && parsed.apiBaseUrl.trim().length > 0) {
      return trimTrailingSlash(parsed.apiBaseUrl);
    }

    if (typeof parsed.healthUrl === "string" && parsed.healthUrl.trim().length > 0) {
      return trimTrailingSlash(parsed.healthUrl);
    }

    if (typeof parsed.health_url === "string" && parsed.health_url.trim().length > 0) {
      return trimTrailingSlash(parsed.health_url);
    }

    return null;
  } catch {
    return null;
  }
};

const readBaseUrlFromConfig = async (candidatePaths: string[]): Promise<string | null> => {
  for (const path of candidatePaths) {
    try {
      const raw = await readFile(path, "utf8");
      const configured = parseConfiguredBaseUrl(raw);

      if (configured) {
        return configured;
      }
    } catch {
      // Try next candidate path.
    }
  }

  return null;
};

const resolveRuntimeBaseUrl = async (input: RuntimeVerificationInput): Promise<string> => {
  if (typeof input.runtimeBaseUrl === "string" && input.runtimeBaseUrl.trim().length > 0) {
    return trimTrailingSlash(input.runtimeBaseUrl);
  }

  const envBaseUrl = process.env.ENGRAM_API_BASE_URL;
  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return trimTrailingSlash(envBaseUrl);
  }

  const candidateConfigPaths = input.configFilePath
    ? [input.configFilePath]
    : [
        join(process.cwd(), ".engram-gui", "config.json"),
        join(process.cwd(), "src-tauri", ".engram-gui", "config.json"),
      ];

  const configBaseUrl = await readBaseUrlFromConfig(candidateConfigPaths);
  if (configBaseUrl) {
    return configBaseUrl;
  }

  return DEFAULT_RUNTIME_BASE_URL;
};

export const runRuntimeParityMatrixVerification = async (
  input: RuntimeVerificationInput = {},
): Promise<ParityMatrixReport> => {
  const runtimeBaseUrl = await resolveRuntimeBaseUrl(input);
  const outputFilePath = input.outputFilePath ?? `${process.cwd()}/artifacts/parity-matrix-evidence.md`;
  const plan = createParityMatrixPlan(runtimeBaseUrl);
  const report = await verifyParityMatrix(plan, input.fetcher ?? fetch);
  const markdown = renderParityMatrixEvidence(report);

  await mkdir(dirname(outputFilePath), { recursive: true });
  await writeFile(outputFilePath, markdown, "utf8");

  return report;
};
