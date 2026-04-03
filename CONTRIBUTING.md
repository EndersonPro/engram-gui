# Contributing to Engram GUI

Thanks for helping improve Engram GUI.

This project is currently in an early stage, so clear feedback, focused pull requests, and reproducible bug reports are very valuable.

## First Principles

- This repo is a desktop GUI client.
- Core memory runtime, CLI, MCP, and HTTP server belong to the upstream Engram project:
  https://github.com/Gentleman-Programming/engram
- Keep changes aligned with this boundary. Avoid mixing GUI concerns with upstream server internals in this repo.

## Development Setup

1. Fork and clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Ensure upstream Engram is installed and available.
4. Optional but recommended: run Engram API locally:

```bash
engram serve 7437
```

5. Run desktop app in development mode:

```bash
npm run tauri dev
```

## Quality Checks Before PR

Run the following checks before opening or updating a pull request:

```bash
npm run typecheck
npm run test
```

Rust-side tests:

```bash
cd src-tauri
cargo test
```

## Pull Request Guidelines

- Keep PRs small and focused.
- Include a clear problem statement and proposed solution.
- If UI changes are included, add screenshots in the PR description.
- Update docs when behavior, flows, or contracts change.
- Prefer incremental changes over large refactors.

## Commit Style

Use Conventional Commits when possible.

Examples:

- `feat(ui): add empty state for timeline page`
- `fix(runtime): handle binary unavailable status gracefully`
- `docs(readme): clarify GUI vs CLI server responsibilities`

## Issue Reporting

When reporting a bug, include:

- OS and app version
- Steps to reproduce
- Expected result
- Actual result
- Relevant logs or screenshots

When requesting a feature, include:

- Problem to solve
- Proposed UX or workflow
- Why this belongs in GUI scope

## Scope and Architecture Notes

Current architecture uses feature-first organization and guarded route graduation semantics.
When adding new features, follow existing patterns in:

- `src/features/*`
- `src/shared/api/*`
- `src/app/router/*`

## Code of Conduct

Be respectful and constructive.
Assume good intent, discuss ideas on technical merit, and keep collaboration professional.

## Need Help?

Open an issue with context and proposed direction.
If you are unsure whether a change belongs in this repo or upstream Engram, ask first in the issue before implementing.
