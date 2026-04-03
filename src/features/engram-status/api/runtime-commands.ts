import { invoke } from "@tauri-apps/api/core";

import type { RuntimeStatusPayload } from "@features/engram-status/state/runtime-store";

export interface EngramConfigDto {
  binaryPath: string | null;
  apiBaseUrl: string;
  healthUrl?: string;
}

export interface SetEngramConfigInput {
  binaryPath: string | null;
  apiBaseUrl: string;
}

export const checkEngramStatus = () => invoke<RuntimeStatusPayload>("check_engram_status");

export const startEngram = () => invoke<RuntimeStatusPayload>("start_engram");

export const stopEngram = () => invoke<RuntimeStatusPayload>("stop_engram");

export const restartEngram = () => invoke<RuntimeStatusPayload>("restart_engram");

export const getEngramConfig = () => invoke<EngramConfigDto>("get_engram_config");

export const setEngramConfig = (input: SetEngramConfigInput) =>
  invoke<EngramConfigDto>("set_engram_config", { input });
