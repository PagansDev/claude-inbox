# ADR 02 — Hook integration contract

**Status:** Accepted — 2026-10-10. Verified by the Task 03 spike on 2026-10-11 ([spike report](../spike-report.md)).

## Context
The official reference (https://code.claude.com/docs/en/hooks, read 2026-10-08, Claude Code 2.1.292) states:

- An `http` hook POSTs the event JSON. Its response is handled like this:
  - a 2xx with an empty body means success;
  - a 2xx with a JSON body is parsed as hook output;
  - a non-2xx status or a connection failure is a non-blocking error, and execution continues.
- A `PreToolUse` HTTP hook that times out is cancelled. The tool call continues through the normal permission flow.
- For `AskUserQuestion`, `permissionDecision: "allow"` alone is not enough. The hook must return `updatedInput` with the original `questions` plus `answers`, a map from question text to the selected label, with multi-select labels joined by commas.
- `PermissionRequest` decides with `hookSpecificOutput.decision.behavior` (`allow`/`deny`). Deny rules from settings still apply.
- In sessions that use `canUseTool` (the VS Code extension, the desktop app), permission hooks run alongside the native dialog, and whichever decides first wins.
- All matching hooks run in parallel. The default HTTP timeout is 600 s, and no maximum is documented.

## Problem
Which events the inbox subscribes to, what it answers for each, and how it fails without ever blocking a session.

## Decision

| Event (matcher) | Endpoint | Held until the user acts? | Response |
|-----------------|----------|---------------------------|----------|
| `PreToolUse` (`AskUserQuestion`) | `POST /hooks/pre-tool-use` | Yes | `permissionDecision: "allow"` + `updatedInput: { questions, answers }` |
| `PermissionRequest` | `POST /hooks/permission-request` | Yes | `decision.behavior` `allow` or `deny` (with `message` on deny) |
| `Notification` | `POST /hooks/notification` | No | `200` with an empty body, immediately |
| `Stop` | `POST /hooks/stop` | No | `200` with an empty body, immediately. The session is shown as waiting for a prompt |

- **Server address:** `127.0.0.1:7777` by default, configurable.
- **Timeout:** `3600` s on the two held hooks. A timeout falls back to the native dialog, so a long timeout is safe.
- **Failure modes, all non-blocking:**
  - When the app is closed, the connection is refused, so the native dialog appears.
  - An invalid request gets a non-2xx response, so the native dialog appears.
  - The server never returns a 2xx with a non-JSON body.
- **Answer values (verified):**
  - single choice: the option label;
  - multi-select: the labels joined by `", "`;
  - free text ("Other"): any other string.

  Claude Code tells the cases apart by itself.
- **Stale items:**
  - When Claude Code cancels the request (timeout, or Esc in the session), the connection closes, axum drops the handler future, and the item is removed from the queue through a drop guard. Verified for the timeout case: the server saw the close before replying.
  - The user never answers a dead item.
- **Installer:**
  - It adds the entries to `~/.claude/settings.json`, merging them with existing hooks.
  - It identifies its own entries by the URL prefix `http://127.0.0.1:<port>/hooks/`.
  - Uninstall removes only those entries. Re-installing is idempotent.
- **Contract fixtures:** real payloads captured by the spike, with personal paths removed, live in `fixtures/hooks/` (Claude Code 2.1.292 and 2.1.296, terminal and VS Code).
- **Decline:** the native dialog lets the user decline. How a hook expresses a decline is not yet verified; the MVP checks it before offering the action.

## Consequences
- The fallback the PRD requires holds by construction: every failure path is a documented non-blocking error.
- `Notification` and `Stop` never slow a session down.
- On surfaces that use `canUseTool`, the native permission dialog still appears alongside the popup. That is the documented behaviour, and the user can answer either one.

## Alternatives considered
- **`command` hooks calling a CLI that talks to the app:** an extra process per call, and the CLI must reproduce the fail-open behaviour itself. HTTP hooks give that behaviour for free.
- **Holding `Notification` and `Stop` until acknowledged:** they have no decision to return, so holding them would only delay the session.
- **`permissionDecision: "defer"`:** was kept as the fallback in case `answers` did not skip the dialog. The spike showed that it does, so `defer` is not used.
