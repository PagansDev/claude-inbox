# Sprint: 1 Inbox Foundation

Issue: [#1](https://github.com/PagansDev/claude-inbox/issues/1) · Board: @PagansDev's Kamban

## Overview
Lay the architectural and tooling foundation of claude-inbox and prove, in a real Claude Code session, that a `PreToolUse` HTTP hook can answer an `AskUserQuestion` call through `updatedInput.answers` while keeping the native-dialog fallback when the app is not running.

→ [PRD.md](./PRD.md)

---

## Sprint Roadmap

> Draft written in Step 0.6. It is closed and approved by the human in Phase 4: one row per task. A task file and its spec are only written when the task becomes active. Until then the Task and Spec columns have no link.

| # | Task | Objective | Depends on | Spec | Related ADRs | Status |
|---|------|-----------|------------|------|--------------|--------|
| 01 | Task 01 — Repository baseline | MIT LICENSE, README, .gitignore and the `/docs` skeleton | — | — | — | 🔄 |
| 02 | Task 02 — Commit tooling | package.json, Husky, Biome, lint-staged and a Conventional Commits check that reject non-conforming commits | 01 | — | — | 🔲 |
| 03 | Task 03 — Hook viability spike | Minimal local server and `PreToolUse` hook on `AskUserQuestion` that answers automatically; manual test procedure and written report across six cases | 02 | — | — | 🔲 |
| 04 | Task 04 — Tauri scaffold | Tauri v2 app (Rust backend, TypeScript frontend) building on Linux, with rustfmt and clippy wired into the git hooks | 02 | — | — | 🔲 |
| 05 | Task 05 — i18n skeleton | pt-BR, en and es catalogues, locale detection and fallback, with the scaffold window rendering only catalogue text | 04 | — | — | 🔲 |

Legend: 🔲 not started · 🔄 in progress · ✅ done · 🚫 blocked (reason in Risks and Open Decisions) · 🗑️ dropped

### Roadmap Changes

> Only after approval in Phase 4. Edits to the draft are not recorded here.

| When (active task) | Change | Reason |
|--------------------|--------|--------|

---

## Skills Consulted (Phase 2.0)

| Skill | Path | What it changed |
|-------|------|-----------------|
| satlab-protocol | `.claude/skills/satlab-protocol/` | It is the only skill in the repository, and it is the protocol itself rather than a project-specific skill. It fixes the sprint process, the commit policy (approved messages, explicit paths, `chore`-only on `main`, no AI attribution, no push) and the end-of-sprint security scan. Its sub-skills `backend-guidelines` and `security-scan` apply to the spike server and the future hook server. `frontend-master`, `frontend-guidelines` and `web-design-guidelines` apply from Task 05 on. No codebase-specific rules exist yet; this is a greenfield repository. |

## ADRs

> Created in Step 0.7.

---

## Sprint Checkpoint

> Update before moving between phases. A phase only starts when the previous one is marked complete here.

- [x] Requirement deepened and PRD approved by the human
- [ ] Minimum ADRs created
- [ ] Roadmap approved by the human and recorded in the issue (Phase 4)
- [ ] Every roadmap row ✅ or 🗑️ (each task: activation → spec → RED → GREEN → refactor → Record)
- [ ] Tests, lint, typecheck and build passing on the final tree
- [ ] Critical code review done (REVIEW.md)
- [ ] Security scan done and findings decided by the human (security-scan.md)
- [ ] Sprint delivered with summary and residual risks
- [ ] Merged into main (human)
- [ ] Issue closed and board item moved to done

---

## Risks and Open Decisions

| Item | Pending decision | Owner |
|------|------------------|-------|
| MCP servers | Lexomni and Context7 were not loaded when the sprint started; the session must be restarted with both before Step 0.7 | PagansDev |
| Branching | Tasks 01 and 02 are `chore` and can land on `main`. Tasks 03–05 need a branch (e.g. `feat-inbox-foundation`) | PagansDev |
| Spike language | Proposed: TypeScript on Node 24 (native type stripping, no build step), so Biome covers it. Decided in the ADRs | PagansDev |
