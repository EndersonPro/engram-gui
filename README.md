# Engram GUI (Contract-Graduated Desktop Shell)

Local-first desktop shell for Engram built with React + TypeScript + Vite on top of Tauri 2.

## Current Scope and Guardrails

- ✅ Runtime health/status + lifecycle commands are wired.
- ✅ Frontend adapter semantics are normalized to `success | empty | retryable_failure`.
- ✅ Non-health contract registry is ratified for `memories`, `search`, `timeline`, `context`, and `settings`.
- ✅ Graduation order is locked and complete: `memories → search → timeline → context → settings`.
- ✅ Transport allowlist now includes all graduated non-health routes; guard tests enforce ordered graduation and per-route preconditions (contract + adapter + guardrail).
- 🚫 `get_engram_logs` remains intentionally deferred and out-of-scope for this change.

## Development commands

- `npm run test` — run Vitest suite.
- `npm run typecheck` — run TypeScript type checks.
- `cargo test` (inside `src-tauri`) — run Rust unit tests.
