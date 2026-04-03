import { useQuery } from "@tanstack/react-query";

import type { TimelineDto, TimelineParams, TimelineQueryParams } from "@shared/api/contracts/non-health-types";
import type { AdapterResult, RetryableFailure } from "@shared/types/adapter";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: TimelineQueryParams = {
  observation_id: 1,
  before: 5,
  after: 5,
};

const toParityParams = (params: TimelineQueryParams | TimelineParams): TimelineQueryParams => {
  if ("observation_id" in params) {
    return {
      ...defaultParams,
      ...params,
    };
  }

  const parsedId = Number.parseInt(params.observationId, 10);
  return {
    observation_id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : 0,
    before: defaultParams.before,
    after: params.limit,
  };
};

const toLegacyTimeline = (
  result: Awaited<ReturnType<typeof engramApiAdapter.listTimeline>>,
): AdapterResult<TimelineDto | null, RetryableFailure> => {
  if (result.kind === "retryable_failure") {
    return result;
  }

  if (result.kind === "empty" || result.data === null) {
    return { kind: "empty", data: null };
  }

  return {
    kind: "success",
    data: {
      entries: [...result.data.before, { ...result.data.focus, isFocus: true }, ...result.data.after].map((entry, index) => ({
        id: `timeline-${index}`,
        label: JSON.stringify(entry),
        happenedAt: "",
      })),
    },
  };
};

const validationFailure = (message: string): AdapterResult<TimelineDto | null, RetryableFailure> => ({
  kind: "retryable_failure",
  error: {
    code: "VALIDATION_ERROR",
    message,
    retryable: true,
  },
});

export interface TimelineQueryRuntimeOptions {
  enabled?: boolean;
}

let lastValidTimelineParamsForRetry: TimelineQueryParams | null = null;

export const getLastValidTimelineParamsForRetry = () => {
  return lastValidTimelineParamsForRetry;
};

export const resetLastValidTimelineParamsForRetry = () => {
  lastValidTimelineParamsForRetry = null;
};

export const createTimelineQueryOptions = (
  params: TimelineQueryParams | TimelineParams = defaultParams,
  runtimeOptions: TimelineQueryRuntimeOptions = {},
) => {
  const parityParams = toParityParams(params);
  const hasValidObservationId = Number.isInteger(parityParams.observation_id) && parityParams.observation_id > 0;

  if (hasValidObservationId) {
    lastValidTimelineParamsForRetry = parityParams;
  }

  return {
    queryKey: queryKeys.engram.timeline.list(parityParams),
    queryFn: () => {
      if (!Number.isInteger(parityParams.observation_id) || parityParams.observation_id <= 0) {
        return Promise.resolve(validationFailure("Timeline requires a positive integer observation_id"));
      }

      return engramApiAdapter.listTimeline(parityParams).then(toLegacyTimeline);
    },
    staleTime: 5_000,
    enabled: runtimeOptions.enabled ?? hasValidObservationId,
  };
};

export const useTimeline = (
  params: TimelineQueryParams | TimelineParams = defaultParams,
  runtimeOptions: TimelineQueryRuntimeOptions = {},
) => {
  return useQuery(createTimelineQueryOptions(params, runtimeOptions));
};
