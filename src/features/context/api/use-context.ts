import { useQuery } from "@tanstack/react-query";

import type { ContextParams } from "@shared/api/contracts/non-health-types";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: ContextParams = {
  project: undefined,
  scope: undefined,
};

export const createContextQueryOptions = (params: ContextParams = defaultParams) => ({
  queryKey: queryKeys.engram.context.get({
    ...defaultParams,
    ...params,
  }),
  queryFn: () =>
    engramApiAdapter.getContext({
      ...defaultParams,
      ...params,
    }),
  staleTime: 5_000,
});

export const useContextData = (params: ContextParams = defaultParams) => {
  return useQuery(createContextQueryOptions(params));
};
