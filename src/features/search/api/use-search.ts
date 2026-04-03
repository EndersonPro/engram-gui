import { useQuery } from "@tanstack/react-query";

import type { SearchDto, SearchParams, SearchQueryParams } from "@shared/api/contracts/non-health-types";
import type { AdapterResult, RetryableFailure } from "@shared/types/adapter";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: SearchQueryParams = {
  q: "",
  project: undefined,
  scope: undefined,
  limit: 20,
};

const toParityParams = (params: SearchQueryParams | SearchParams): SearchQueryParams => {
  if ("q" in params) {
    return {
      ...defaultParams,
      ...params,
    };
  }

  return {
    q: params.query,
    project: undefined,
    scope: undefined,
    limit: params.limit,
  };
};

const toLegacySearch = (
  result: Awaited<ReturnType<typeof engramApiAdapter.searchQuery>>,
): AdapterResult<SearchDto | null, RetryableFailure> => {
  if (result.kind === "retryable_failure") {
    return result;
  }

  if (result.kind === "empty" || result.data === null) {
    return { kind: "empty", data: null };
  }

  return {
    kind: "success",
    data: {
      items: result.data.map((entry) => ({
        id: String(entry.observation.id),
        snippet: entry.observation.content,
      })),
    },
  };
};

const validationFailure = (message: string): AdapterResult<SearchDto | null, RetryableFailure> => ({
  kind: "retryable_failure",
  error: {
    code: "VALIDATION_ERROR",
    message,
    retryable: true,
  },
});

export interface SearchQueryRuntimeOptions {
  enabled?: boolean;
}

let lastValidSearchParamsForRetry: SearchQueryParams | null = null;

export const getLastValidSearchParamsForRetry = () => {
  return lastValidSearchParamsForRetry;
};

export const resetLastValidSearchParamsForRetry = () => {
  lastValidSearchParamsForRetry = null;
};

export const createSearchQueryOptions = (
  params: SearchQueryParams | SearchParams = defaultParams,
  runtimeOptions: SearchQueryRuntimeOptions = {},
) => {
  const parityParams = toParityParams(params);
  const normalizedParams = {
    ...parityParams,
    q: parityParams.q.trim(),
  };

  if (normalizedParams.q.length > 0) {
    lastValidSearchParamsForRetry = normalizedParams;
  }

  return {
    queryKey: queryKeys.engram.search.query({
      ...normalizedParams,
    }),
    queryFn: () => {
      if (!normalizedParams.q) {
        return Promise.resolve(validationFailure("Search requires a non-empty query parameter 'q'"));
      }

      return engramApiAdapter
        .searchQuery({
          ...normalizedParams,
        })
        .then(toLegacySearch);
    },
    staleTime: 5_000,
    enabled: runtimeOptions.enabled ?? normalizedParams.q.length > 0,
  };
};

export const useSearch = (
  params: SearchQueryParams | SearchParams = defaultParams,
  runtimeOptions: SearchQueryRuntimeOptions = {},
) => {
  return useQuery(createSearchQueryOptions(params, runtimeOptions));
};
