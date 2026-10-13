---
name: claude-code-hooks
description: How claude-inbox talks to Claude Code through HTTP hooks — the verified request and response shapes, the fail-open rules, the token header, stale-item detection, and the traps found while proving it. TRIGGER when writing or changing the hook server, the hook installer, the queue, the popup's answer actions, or any code that builds a hook response; when adding a new hook event; when testing hooks in a real session. SKIP for UI work that never touches hook payloads, and for tooling.
---

# Claude Code hooks — the claude-inbox contract

Source of truth: ADR 02 (contract) and ADR 03 (security) in `.sprints/1 Inbox Foundation/ADRs/`, verified by the Task 03 spike (`.sprints/1 Inbox Foundation/spike-report.md`) on Claude Code 2.1.292 and 2.1.296, in the terminal and in the VS Code extension. Real payloads: `fixtures/hooks/`.

Before changing anything here, re-read the official reference (https://code.claude.com/docs/en/hooks). Do not rely on memory or on this file alone; hook schemas move between Claude Code versions.

## Answering AskUserQuestion

- Hook: `PreToolUse`, matcher `AskUserQuestion`, type `http`.
- Response, `200` with JSON:
  ```json
  {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow",
    "updatedInput":{"questions":[...the original questions, unchanged...],"answers":{"<question text>":"<value>"}}}}
  ```
- `"allow"` alone does **not** answer the question. `updatedInput` must carry the original `questions` **and** `answers`, because it replaces the whole input.
- Answer values, all verified:
  - single choice: the option `label`, exactly;
  - multi-select: the labels joined by `", "` (comma plus space). Claude Code recognises them as listed options;
  - free text ("Other"): any other string. Claude Code detects it and changes the tool result wording by itself. No extra field is needed.
- `answers` is keyed by the question **text**, not by the header or an index.

## Fail-open: never block a session

Every failure must end in the native dialog. Verified paths:

| Situation | What the server does | What the user sees |
|-----------|----------------------|--------------------|
| App closed | — (connection refused) | Native dialog at once |
| Bad or missing token | `401`, empty body | Native dialog at once |
| Hook timeout | — (Claude Code closes the connection) | Native dialog after the timeout |

Rules that follow:

- Never return a `2xx` with a non-JSON body.
- Never return a `2xx` JSON body with a decision when unsure. Reject with a non-2xx instead.
- Use a long timeout (`3600`) on held hooks. A timeout is safe because it falls back to the native dialog.

## Stale items

When Claude Code gives up (timeout, or the user presses Esc in the session), it **closes the HTTP connection** before the server replies. The server sees the close. A held request must therefore remove its queue item when its connection closes (in axum: a drop guard in the handler future). Never let the user answer an item whose connection is gone.

## Token header (ADR 03)

- The header is `X-Claude-Inbox-Token`, written as a **literal** value in the hook's `headers` in `~/.claude/settings.json`. It is verified to reach the server unchanged.
- Generate it from a CSPRNG (≥ 128 bits; the project uses 32 bytes as hex), compare it in constant time, and check it **before** reading the body.
- **Never write an empty token.** In the spike, an empty `SPIKE_TOKEN` started a server that rejected everything with no visible error. Fail at startup instead.
- **Never print the token.** The spike printed it, and it ended up in terminal output and screenshots.

## Payload facts (from real captures)

- Every request carries `session_id`, `prompt_id`, `tool_use_id`, `cwd`, `transcript_path`, `scratchpad_dir`, `permission_mode`, `hook_event_name`, `tool_name` and `tool_input`.
- `effort` is an **object**, `{"level":"high"}`, not a string.
- Transport headers: `content-type: application/json`, `user-agent: axios/…`, `connection: keep-alive`.
- The payload is identical in the terminal and in the VS Code extension. In VS Code, an answered question renders as "Answered" with the options pre-selected.
- `options[].description` may simply repeat the `label`. Render it only when it differs.

## Native dialog actions the popup must mirror

- The listed options.
- "Type something." (free text).
- "Chat about this".
- Esc, which records "User declined to answer questions".

Free text is solved. **How a hook expresses "decline" is not verified.** Prove it in a real session before offering a decline button. "Chat about this" has no known hook equivalent.

## Testing hooks in a real session

- `claude -p` does **not** load `AskUserQuestion`. Hook behaviour can only be checked in an interactive session (terminal or VS Code).
- Check the session's real `cwd` before blaming the server. Two "failed" runs in the spike were sessions opened in a directory without the hook. `~/.claude/projects/<dir>/<session>.jsonl` shows where a session ran.
- If nothing reaches the server, look at its request log before changing code. A request that never arrived is a config or directory problem, not a server bug.
- It is unknown whether a running session picks up hooks installed after it started. Tell users to restart open sessions until this is proven.
- Record the Claude Code version with every observation. It auto-updates, even mid-test.
