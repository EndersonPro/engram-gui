import { create } from "zustand";

import type { AdapterResult } from "@shared/types/adapter";
import type { HealthStatusDto, RuntimeProcessState } from "@shared/types/runtime";

export interface RuntimeStatusPayload {
  binaryAvailable: boolean;
  processState: RuntimeProcessState;
  health: HealthStatusDto | null;
  failureReason: string | null;
}

interface RuntimeStoreState {
  binaryAvailable: boolean;
  processState: RuntimeProcessState;
  health: HealthStatusDto | null;
  failureReason: string | null;
  applyRuntimeStatus: (status: RuntimeStatusPayload) => void;
  applyHealthResult: (result: AdapterResult<HealthStatusDto | null>) => void;
}

const initialState = {
  binaryAvailable: false,
  processState: "unavailable" as RuntimeProcessState,
  health: null,
  failureReason: null,
};

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  ...initialState,
  applyRuntimeStatus: (status) => {
    set(() => ({
      binaryAvailable: status.binaryAvailable,
      processState: status.processState,
      health: status.health,
      failureReason: status.failureReason,
    }));
  },
  applyHealthResult: (result) => {
    if (result.kind === "success" || result.kind === "empty") {
      set(() => ({
        health: result.data,
        failureReason: null,
      }));
      return;
    }

    set(() => ({
      failureReason: result.error.message,
    }));
  },
}));

export const resetRuntimeStore = () => {
  useRuntimeStore.setState(initialState);
};
