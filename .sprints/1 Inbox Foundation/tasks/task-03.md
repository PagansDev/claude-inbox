# Task 03 — Hook viability spike

> Activated on 2026-10-10. Original roadmap row: "Minimal Node 24 TypeScript server and `PreToolUse` hook on `AskUserQuestion` that answers automatically; manual procedure, report across six cases, captured payloads as contract fixtures".

## Objective
Prove, in real Claude Code sessions, the assumptions that ADR 02 and ADR 03 rest on:
- answering `AskUserQuestion` through `updatedInput.answers` skips the native dialog, and the answer reaches Claude;
- every failure path falls back to the native dialog;
- a literal token header in the hook config reaches the server;
- a cancelled hook request closes the connection, so the server can detect a stale item.

## Context at activation
- Tasks 01 and 02 are done. The repository has Biome, the no-comments check, commitlint, the `chore`-only guard on `main`, and TypeScript 7 for typechecking. Node 24 runs `.ts` files directly.
- ADR 02 marks two points *to verify*: the free-text answer format and stale-item detection on disconnect. ADR 03's literal-header token was never exercised.
- Claude Code on this machine: 2.1.292.
- `spike/payloads.jsonl` is already in `.gitignore`.

## Scope
- In:
  - `spike/server.ts`;
  - npm scripts to run it;
  - the hook config it prints;
  - the manual procedure;
  - the report;
  - sanitized payload fixtures.
- Out:
  - `PermissionRequest`, `Notification` and `Stop`, which are covered by the docs and built in the MVP;
  - any UI;
  - the installer.

## Steps
1. Write `spike/server.ts`: a Node `http` server on `127.0.0.1`. It checks the token header and logs every payload. It answers `AskUserQuestion` according to `SPIKE_MODE` and `SPIKE_DELAY_MS`, and logs when the client closes the connection before the answer.
2. On start, the server prints the exact `.claude/settings.local.json` content to paste into the test directory, with the token filled in.
3. Add `npm run spike` and document the procedure in the spec.
4. Run the procedure in a test directory outside the repository, then hand it to the maintainer for the cases that need a human: the VS Code extension and observing the dialogs.
5. Write `spike-report.md` with what was observed per case. Copy the sanitized payloads to `fixtures/hooks/`.
6. Update ADR 02 where the spike confirmed or contradicted it.

## Acceptance Criteria
- [ ] Every case in the spec has an observed result in `spike-report.md`.
- [ ] C1 shows no native dialog and Claude reporting the server's answers.
- [ ] C5, C6 and C7 show the native dialog appearing, so the fallback works.
- [ ] C7 shows whether the server sees the connection close when the hook times out.
- [ ] At least one real `PreToolUse`/`AskUserQuestion` payload is stored in `fixtures/hooks/`, without personal paths.
- [ ] ADR 02's *to verify* points are resolved in the ADR.
- [ ] `npm run check` passes. The spike code has no comments.

## Test Strategy
Per ADR 05, the spike is exploratory and has no automated tests. Its proof is the manual procedure in the spec, run in real Claude Code sessions, and its output is the report and the fixtures.

## Dependencies
- Task 02 (tooling).
- ADR 02 (contract) and ADR 03 (token header, loopback).

## Shared files
- `package.json` (one `spike` script, additive).
- `.sprints/1 Inbox Foundation/README.md` (roadmap row).
- `ADRs/adr-02.md` (resolving the *to verify* points).

## Spec and ADRs
- Spec: [Spec 03](../specs/spec-03.md)
- ADRs: [ADR 02](../ADRs/adr-02.md), [ADR 03](../ADRs/adr-03.md), [ADR 05](../ADRs/adr-05.md)

## Progress
- [x] Spec written and reviewed
- [x] Tests written and RED confirmed — not applicable (ADR 05, exploratory spike)
- [x] Spike implemented
- [x] Refactor
- [x] `npm run check` passing
- [x] Manual procedure run and report written

## Record
Closed on 2026-10-11.

**Delivered**
- `spike/server.ts` and `npm run spike`.
- [Spike report](../spike-report.md): all eight cases passed, in the terminal and in the VS Code extension.
- Three sanitized fixtures in `fixtures/hooks/`.
- ADR 02 updated: answer values, stale-item detection and fixtures are verified, and `defer` is no longer needed.

**Differences from the task as written**
- Eight cases instead of six. C6 (wrong token) and C7 (timeout) were added to verify ADR 03's header and ADR 02's stale-item assumption.
- The spike now refuses to start with an empty `SPIKE_TOKEN`. An empty token caused a confusing C7 run.
- Claude Code auto-updated from 2.1.292 to 2.1.296 between runs. Both versions behaved the same.

**What the next tasks need to know**
- The MVP popup needs equivalents of the native dialog's free text and decline actions. How a hook expresses a decline is still unverified (ADR 02).
- Render `description` only when it differs from `label`.
- An item must disappear when its connection closes. This covers both a timeout and Esc pressed in the session.
- The installer must never write an empty token, and should tell the user to restart open sessions.
- `spike/` is deleted when the MVP server replaces it (ADR 04). The fixtures stay.
