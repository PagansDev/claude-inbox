# PRD — 1 Inbox Foundation

Issue: [#1](https://github.com/PagansDev/claude-inbox/issues/1)

## Objective
Lay the architectural and tooling foundation of claude-inbox and prove, in a real Claude Code session, that an HTTP hook can answer an `AskUserQuestion` call on the user's behalf. Nothing in the MVP is worth building until that integration is confirmed.

## Context
Running several Claude Code sessions at once (different repositories, in the terminal, the VS Code extension or the desktop app) means questions and permission requests stall unseen in whichever window asked them. claude-inbox will be a local desktop app that gathers them into one FIFO queue and lets the user answer from a single popup.

The integration relies on Claude Code HTTP hooks, as documented at https://code.claude.com/docs/en/hooks (read on 2026-10-08, Claude Code 2.1.292):

- `PreToolUse` with matcher `AskUserQuestion` receives `tool_input.questions[]`. Returning `permissionDecision: "allow"` alone is not enough for this tool. The hook must return `updatedInput` with the original `questions` plus an `answers` map (question text → selected label; multi-select labels joined by commas).
- `PermissionRequest` receives `tool_name` and `tool_input` and decides with `hookSpecificOutput.decision.behavior` (`allow` or `deny`). In sessions that use `canUseTool` (VS Code extension, desktop app), the hook runs alongside the native dialog, and whichever decides first wins.
- `Notification` carries `message`, `title` and `notification_type`. `Stop` carries `stop_hook_active` and `last_assistant_message`.
- An HTTP hook connection failure or non-2xx response is a non-blocking error. A timed-out `PreToolUse` HTTP hook lets the call continue through the normal permission flow. This is what makes the "app closed → native dialog" fallback possible.
- The default HTTP hook timeout is 600 s, and the docs state no maximum.

## Personas / Stakeholders
- **Maintainer (PagansDev):** runs many Claude Code sessions in parallel on Linux and wants one place to answer them. Owns business rules and acceptance.
- **Open-source users:** Claude Code users on Linux, and later macOS and Windows, who install the app from the public repository. They need a clear README and a safe default install.
- **Contributors:** need the conventions (no comments, English, Conventional Commits, `/docs`) enforced by tooling, not by memory.

## Features
1. Architecture decisions recorded as ADRs: stack, repository structure, conventions, testing strategy and hook integration contract.
2. Repository tooling: Husky git hooks, Biome for TypeScript/JSON, rustfmt and clippy for Rust, Conventional Commits check.
3. Project files: MIT LICENSE, README, .gitignore, `/docs` skeleton.
4. Tauri v2 application scaffold (Rust backend, TypeScript frontend) with an i18n skeleton for pt-BR, en and es.
5. Viability spike: a minimal local HTTP server plus a `PreToolUse` hook on `AskUserQuestion` that answers automatically, with a manual test procedure and a written report of what was observed.

## Acceptance Criteria
- [ ] ADRs reviewed and approved by the maintainer.
- [ ] A commit that breaks Biome, rustfmt, clippy or the Conventional Commits format is rejected by the git hooks.
- [ ] LICENSE (MIT), README and .gitignore are committed.
- [ ] The Tauri scaffold builds on Linux and opens a window whose text comes from the i18n catalogues.
- [ ] In a real Claude Code session with the spike hook installed in a test directory, the spike answers an `AskUserQuestion` call: the native dialog does not appear, and Claude reports the answer the server sent.
- [ ] The spike report covers: single choice, free-text ("Other") answer, multi-select, a delayed answer (≥ 30 s), server down (native dialog must appear), and the same flow in the VS Code extension.
- [ ] If `answers` does not skip the dialog on some surface, the report documents the observed behaviour and the alternative to pursue.

## Constraints
- **Technical:**
  - The fallback must keep working: a hook failure or timeout must never block a session.
  - The server binds to `127.0.0.1` only and rejects requests without the installer-generated token header.
  - Linux first, with no Linux-only APIs.
  - Node 24 and Rust stable as available on the maintainer's machine.
- **Conventions:**
  - Code, commits, docs, ADRs and issues are in English.
  - The UI is translated into pt-BR, en and es.
  - No code comments; explanations live in `/docs`.
  - Conventional Commits.
  - Only `chore` commits land directly on `main`; other work goes through branches.
  - No AI attribution in commits.
- **Time:** none stated.

## Out of Scope
- The inbox UI, the queue, native notifications, the Stop indicator and the hook installer/uninstaller (sprint 2, MVP).
- Starting or managing Claude Code sessions.
- Persistent history.
- Sync between machines.
- macOS and Windows builds.

## Risks and Uncertainties
| Risk | Impact | Mitigation |
|------|--------|------------|
| `answers` via `updatedInput` does not skip the native dialog on some surface (e.g. the VS Code extension, which uses `canUseTool`) | High: the core idea fails on that surface | The spike tests every surface. Alternatives to check: `permissionDecision: "defer"`, or accepting a concurrent native dialog |
| In VS Code and the desktop app, the native permission dialog runs alongside the hook, so an inbox item can go stale when answered natively | Medium: the user answers twice or answers a dead item | The spike observes whether Claude Code closes the HTTP request when the native answer wins. The MVP drops items on client disconnect |
| Hook schemas change in future Claude Code versions | Medium | Record the tested Claude Code version. Keep contract fixtures from real payloads captured by the spike |
| Very long hook timeouts (3600 s) behave differently from the documented 600 s default | Medium | The spike tests a long delay. Timeout stays configurable |
| Tauri system libraries (`webkit2gtk-4.1`, `libsoup-3.0`) are not installed; tray icons on GNOME need the AppIndicator extension | Low: blocks the scaffold build until installed | The maintainer installs them with `sudo apt` before the scaffold task. Tray is not required this sprint |
| Lexomni and Context7 MCP servers were not loaded when the sprint started | Medium: the protocol requires both before ADRs | The maintainer restarts the session with both enabled before Step 0.7 |
