# Engram GUI

Open-source desktop client for Engram.

Engram GUI is a local-first desktop shell built with React + TypeScript + Vite on top of Tauri 2.
It is only a GUI client. The memory engine and API server are provided by the main Engram project:
https://github.com/Gentleman-Programming/engram

This project is in an early stage and contributors are very welcome.

Language:
- English (default): this file
- Espanol: [README.es.md](./README.es.md)

## Screenshots / Capturas

### Dashboard

![Engram GUI dashboard with runtime controls and system intelligence](./screenshots/screenshot_01.png)

### Memories

![Engram GUI memories list showing recent observations and details](./screenshots/screenshot_02.png)

### Timeline

![Engram GUI timeline view with chronological observation flow](./screenshots/screenshot_03.png)

## What This Project Is

- Desktop GUI for operating and visualizing Engram workflows.
- Connects to Engram runtime and HTTP/API endpoints exposed by the Engram CLI server.
- Includes runtime lifecycle controls and views for memories, search, timeline, context, and sync/stat insights.
- Focused on developer ergonomics and local-first usage.

## Current Status

- Runtime health/status and lifecycle actions are wired.
- Adapter semantics are normalized to `success | empty | retryable_failure`.
- Non-health routes are graduated and allowlisted: `search`, `timeline`, `context`, `observations`, `sync`, `stats`.
- Guard tests enforce graduation order and preconditions (contract + adapter + guardrail).
- `get_engram_logs` remains intentionally deferred.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, TailwindCSS, shadcn/ui.
- Desktop runtime: Tauri 2 (Rust backend + native shell).
- State and data: Zustand + TanStack Query.
- Testing: Vitest + React Testing Library.

## Prerequisites

1. Node.js 18+ (or Bun).
2. Rust toolchain (stable) for Tauri backend.
3. Tauri desktop prerequisites for your OS.
4. Engram installed and available locally (CLI/API server):
   https://github.com/Gentleman-Programming/engram

## Quick Start

```bash
# 1) Install dependencies
npm install

# 2) (Optional but recommended) start Engram API server
engram serve 7437

# 3) Run GUI in desktop dev mode
npm run tauri dev
```

## Local Development

### Common Commands

```bash
# Frontend dev server
npm run dev

# Type checking
npm run typecheck

# Tests
npm run test
npm run test:watch

# Production frontend build
npm run build

# Tauri command passthrough
npm run tauri
```

```bash
# Rust tests (inside src-tauri)
cd src-tauri
cargo test
```

## Architecture at a Glance

```text
src/
	app/         shell, routing, providers
	features/    domain features (api/model/ui/stub)
	pages/       route-level screens
	shared/      adapters, contracts, shared types
	components/  reusable UI primitives
src-tauri/
	src/commands runtime, config, and proxy command handlers
```

## Relationship to Engram Server

This repository does not replace Engram core.
It is a GUI client that integrates with the Engram CLI/server ecosystem.

If you need installation, agent setup, architecture, or CLI docs for the memory engine itself, go to:
https://github.com/Gentleman-Programming/engram

## Contributing

We welcome contributions and feedback, especially while the project is still early.

- Start with [CONTRIBUTING.md](./CONTRIBUTING.md).
- Open issues for bugs, UX improvements, or feature ideas.
- Keep PRs focused, tested, and easy to review.

## Known Limitations

- `get_engram_logs` is intentionally out of scope.
- E2E testing is not enabled yet.
- Some areas are still evolving as part of ongoing graduation work.

## Roadmap (Early Stage)

- Improve feature completeness for settings and deeper operational flows.
- Harden contribution workflows and community templates.
- Continue stability and parity verification against Engram endpoints.

## Security

If you find a security issue, please avoid public disclosure first and open a private channel with maintainers when possible.

## License

MIT. See [LICENSE](./LICENSE).
