import { useQuery } from "@tanstack/react-query";

import type { ObservationsRecentParams } from "@shared/api/contracts/non-health-types";
import type { ObservationDto } from "@shared/api/engram-adapter";
import type { AdapterResult, RetryableFailure } from "@shared/types/adapter";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: ObservationsRecentParams = {
  project: undefined,
  scope: undefined,
  limit: 20,
};

type ObservationsResult = AdapterResult<ObservationDto[] | null, RetryableFailure>;
type ObservationDetailResult = AdapterResult<ObservationDto | null, RetryableFailure>;

const observationDetailValidationFailure = (message: string): ObservationDetailResult => ({
  kind: "retryable_failure",
  error: {
    code: "VALIDATION_ERROR",
    message,
    retryable: true,
  },
});

export const createMemoriesQueryOptions = (params: ObservationsRecentParams = defaultParams): {
  queryKey: ReturnType<typeof queryKeys.engram.observations.recent>;
  queryFn: () => Promise<ObservationsResult>;
  staleTime: number;
} => ({
  queryKey: queryKeys.engram.observations.recent({
    ...defaultParams,
    ...params,
  }),
  queryFn: () =>
    engramApiAdapter.listRecentObservations({
      ...defaultParams,
      ...params,
    }),
  staleTime: 5_000,
});

export const useMemories = (params: ObservationsRecentParams = defaultParams) => {
  return useQuery(createMemoriesQueryOptions(params));
};

export const createObservationDetailQueryOptions = (params: { id: number }) => ({
  queryKey: queryKeys.engram.observations.detail({ id: params.id }),
  queryFn: (): Promise<ObservationDetailResult> => {
    if (!Number.isInteger(params.id) || params.id <= 0) {
      return Promise.resolve(observationDetailValidationFailure("Observation detail requires a positive integer id"));
    }

    return engramApiAdapter.getObservationById({
      id: params.id,
    });
  },
  staleTime: 5_000,
});

export const useObservationDetail = (params: { id: number }) => {
  return useQuery(createObservationDetailQueryOptions(params));
};
