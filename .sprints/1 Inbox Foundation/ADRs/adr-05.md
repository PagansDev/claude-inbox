# ADR 05 — Testing strategy and definition of done

**Status:** Accepted — 2026-10-10

## Context
The protocol requires tests before code, running only the affected specs by explicit path, and a manual end-to-end path for anything that touches an external system. Claude Code is that external system. Its behaviour can only be proven in a real session, and a green unit suite says nothing about whether a hook response actually skips a dialog.

## Problem
What is tested where, and what "done" means for a task.

## Decision

**Test layers**

| Layer | Tool | What it covers |
|-------|------|----------------|
| Rust domain | `cargo test` (unit) | `queue/` ordering, answer, cancel and cap; `installer/` merge, idempotency and uninstall; `hooks/` response building |
| Rust contract | `cargo test` with fixtures | Real payloads captured by the spike parse into `hooks/` types; built responses match the documented shapes |
| Rust HTTP | `cargo test` with `tower::ServiceExt::oneshot` on the router | Token check, content type, body cap, routing, immediate 200 for `Notification`/`Stop`. No real socket |
| Frontend | Vitest + Testing Library | Components render queue items, honour multi-select and free text, call the answer command; locale fallback |
| Tooling | `node --test` | `scripts/` checks |
| End to end | Manual, in a real Claude Code session | The behaviour the user sees. Every task that touches hooks ships a written procedure and what a healthy run prints |

**Rules**
- Run only the affected specs, by explicit path. The full suite runs only on explicit request.
- A reproducible bug becomes a regression test first.
- The Task 03 spike is exploratory and has no automated tests. Its deliverable is the observation report, and its captured payloads become the contract fixtures.

**Definition of done (per task)**
1. The affected specs pass, and RED was seen before GREEN.
2. `npm run check` passes (Biome, no comments, `tsc`).
3. When Rust is touched, `cargo fmt --check` and `cargo clippy -- -D warnings` pass.
4. The build passes when the change affects it.
5. The manual end-to-end path was run by the AI first and handed to the maintainer when Claude Code is involved.
6. `/docs` is updated for anything that would otherwise have been a comment.
7. The commit message is approved by the maintainer.

## Consequences
- Rust business logic is tested without a socket or a window, so the tests run fast.
- What no automated test can prove (dialog skipped, fallback, stale items) is covered by a manual procedure that is written down and repeatable.

## Alternatives considered
- **Driving Claude Code from automated E2E tests:** not feasible without a scripted interactive client, and it would test Claude Code more than this app.
- **Playwright against the Tauri webview:** deferred. The frontend is small enough for component tests until the MVP shows otherwise.
