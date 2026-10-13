# Sprint: 1 Inbox Foundation

Issue: [#1](https://github.com/PagansDev/claude-inbox/issues/1) · Board: @PagansDev's Kamban (status: In progress, assignee: PagansDev)

<details>
<summary>Board ids (Projects v2)</summary>

| What | Id |
|------|----|
| Project `@PagansDev's Kamban` (number 1) | `PVT_kwHOAwwIXs4BkoEm` |
| Status field | `PVTSSF_lAHOAwwIXs4BkoEmzhjYA0M` |
| Backlog / Ready / In progress / In review / Test / Done | `f75ad846` / `61e4505c` / `47fc9ee4` / `df73e18b` / `ba1e5bfd` / `98236657` |
| Issue #1 item | `PVTI_lAHOAwwIXs4BkoEmzg_y7Fk` |

</details>

## Overview
Lay the architectural and tooling foundation of claude-inbox and prove, in a real Claude Code session, that a `PreToolUse` HTTP hook can answer an `AskUserQuestion` call through `updatedInput.answers` while keeping the native-dialog fallback when the app is not running.

→ [PRD.md](./PRD.md)

---

## Sprint Roadmap

> Approved by the human in Phase 4 on 2026-10-10: one row per task. A task file and its spec are only written when the task becomes active. Until then the Task and Spec columns have no link.

| # | Task | Objective | Depends on | Spec | Related ADRs | Status |
|---|------|-----------|------------|------|--------------|--------|
| 01 | Task 01 — Repository baseline | MIT LICENSE, README, .gitignore and the `/docs` skeleton | — | — | — | ✅ |
| 02 | Task 02 — Commit tooling | package.json, Husky, Biome, lint-staged and a Conventional Commits check that reject non-conforming commits | 01 | — | — | ✅ |
| 03 | [Task 03 — Hook viability spike](tasks/task-03.md) | Minimal Node 24 TypeScript server and `PreToolUse` hook on `AskUserQuestion` that answers automatically; manual procedure, report across six cases, captured payloads as contract fixtures | 02 | [Spec 03](specs/spec-03.md) | [ADR 02](ADRs/adr-02.md), [ADR 05](ADRs/adr-05.md) | ✅ |
| 04 | [Task 04 — Tauri scaffold](tasks/task-04.md) | Tauri v2 app (Rust backend, React + Vite + Tailwind + lucide-react frontend) building on Linux, with the ADR 04 folder layout; rustfmt, clippy and a Rust no-comments check in the git hooks | 02 | [Spec 04](specs/spec-04.md) | [ADR 01](ADRs/adr-01.md), [ADR 04](ADRs/adr-04.md), [ADR 05](ADRs/adr-05.md) | ✅ |
| 05 | [Task 05 — i18n skeleton](tasks/task-05.md) | Typed pt-BR, en and es catalogues (missing key = type error), `navigator.language` detection with `en` fallback, scaffold window rendering only catalogue text | 04 | [Spec 05](specs/spec-05.md) | [ADR 04](ADRs/adr-04.md) | ✅ |
| 06 | [Task 06 — Review fixes](tasks/task-06.md) | Fix R3, R4, R6 and the two interface findings chosen by the maintainer | 05 | [Spec 06](specs/spec-06.md) | [ADR 04](ADRs/adr-04.md), [ADR 05](ADRs/adr-05.md) | ✅ |

Legend: 🔲 not started · 🔄 in progress · ✅ done · 🚫 blocked (reason in Risks and Open Decisions) · 🗑️ dropped

### Roadmap Changes

> Only after approval in Phase 4. Edits to the draft are not recorded here.

| When (active task) | Change | Reason |
|--------------------|--------|--------|
| Task 03 | Spike cases went from six to eight (C6 wrong token, C7 timeout) | Needed to verify ADR 03's token header and ADR 02's stale-item assumption |
| After Task 05 | Added Task 06 — Review fixes | Code review findings R3, R4, R6 and the two interface findings; the maintainer chose "fix now" ([REVIEW.md](REVIEW.md)) |

---

## Skills Consulted (Phase 2.0)

| Skill | Path | What it changed |
|-------|------|-----------------|
| satlab-protocol | `.claude/skills/satlab-protocol/` | It is the only skill in the repository, and it is the protocol itself rather than a project-specific skill. It fixes the sprint process, the commit policy (approved messages, explicit paths, `chore`-only on `main`, no AI attribution, no push) and the end-of-sprint security scan. Its sub-skills `backend-guidelines` and `security-scan` apply to the spike server and the future hook server. `frontend-master`, `frontend-guidelines` and `web-design-guidelines` apply from Task 05 on. No codebase-specific rules exist yet; this is a greenfield repository. |

## ADRs

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR 01](ADRs/adr-01.md) | Stack and process architecture: one Tauri v2 process, axum server inside, React + Tailwind + lucide-react frontend | Accepted |
| [ADR 02](ADRs/adr-02.md) | Hook integration contract: events, endpoints, responses, timeouts, fail-open behaviour, installer identity | Accepted |
| [ADR 03](ADRs/adr-03.md) | Local server security: loopback, 256-bit token header, JSON-only, caps, text-only rendering | Accepted |
| [ADR 04](ADRs/adr-04.md) | Conventions and structure: language, no comments, typed i18n catalogues, commits, folders, naming | Accepted |
| [ADR 05](ADRs/adr-05.md) | Testing strategy and definition of done | Accepted |

### Sources consulted

| Source | What it changed |
|--------|-----------------|
| Lexomni — maintainer guidelines | React + Tailwind + `lucide-react` for the frontend; YAGNI (no i18n library); controller/service split mapped to `server/` and `queue/` |
| Lexomni — OWASP ASVS 5.0 | 11.5.1 (CSPRNG token, ≥ 128 bits), 3.2.2 (render hook text as text), 2.4.1 (caps), CORS requirements → JSON-only requests with no CORS headers |
| Context7 — Tauri v2 and plugins | axum spawned from `setup` with `tauri::async_runtime::spawn`, shared state via `manage`, events via `emit`; single-instance and notification plugins |
| Context7 — axum | Router with state, `TcpListener` bound to loopback, `oneshot` testing of the router |
| Claude Code hooks reference | The whole contract in ADR 02 |

---

## Sprint Checkpoint

> Update before moving between phases. A phase only starts when the previous one is marked complete here.

- [x] Requirement deepened and PRD approved by the human
- [x] Minimum ADRs created and approved
- [x] Roadmap approved by the human and recorded in the issue (Phase 4) — 2026-10-10
- [x] Every roadmap row ✅ or 🗑️ (each task: activation → spec → RED → GREEN → refactor → Record)
- [x] Tests, lint, typecheck and build passing on the final tree
- [x] Critical code review done ([REVIEW.md](REVIEW.md))
- [x] Security scan done and findings decided by the human ([security-scan.md](security-scan.md))
- [x] Sprint delivered with summary and residual risks — delivery comment posted on #1 (2026-10-12)
- [ ] Merged into main (human)
- [ ] Issue closed and board item moved to done

---

## Risks and Open Decisions

| Item | Pending decision | Owner |
|------|------------------|-------|
| Branch | Tasks 03–05 land on `feat-inbox-foundation` (approved 2026-10-10) | — |
