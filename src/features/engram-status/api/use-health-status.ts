import { useQuery } from "@tanstack/react-query";

import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

export const createHealthStatusQueryOptions = () => ({
  queryKey: queryKeys.engram.health,
  queryFn: () => engramApiAdapter.health(),
  staleTime: 5_000,
});

export const useHealthStatus = () => useQuery(createHealthStatusQueryOptions());
