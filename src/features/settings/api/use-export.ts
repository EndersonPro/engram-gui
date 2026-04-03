import { useQuery } from "@tanstack/react-query";

import type { ExportParams } from "@shared/api/contracts/non-health-types";
import { engramApiAdapter } from "@shared/api/engram-adapter";
import { queryKeys } from "@shared/constants/query-keys";

const defaultParams: ExportParams = {};

export const createExportQueryOptions = (_params: ExportParams = defaultParams) => ({
  queryKey: queryKeys.engram.export.get,
  queryFn: async () => engramApiAdapter.getExport({}),
  staleTime: 0,
  gcTime: 15_000,
});

export const useExportData = (params: ExportParams = defaultParams) => {
  return useQuery(createExportQueryOptions(params));
};
