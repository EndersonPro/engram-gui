export type RuntimeProcessState = "unavailable" | "idle" | "starting" | "running" | "error";

export interface HealthStatusDto {
  status: "ok" | "degraded" | "down";
  checkedAt: string;
  version?: string;
}
