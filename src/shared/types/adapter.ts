export type RetryableFailure = {
  code: string;
  message: string;
  retryable: true;
};

export type AdapterResult<T, E = RetryableFailure> =
  | { kind: "success"; data: T }
  | { kind: "empty"; data: T }
  | { kind: "retryable_failure"; error: E };
