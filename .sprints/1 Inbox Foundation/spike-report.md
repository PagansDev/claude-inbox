# Spike report — Task 03

**Verdict: the integration works.**
- An `http` `PreToolUse` hook on `AskUserQuestion` that returns `permissionDecision: "allow"` with `updatedInput.answers` skips the native dialog, and Claude receives the answers.
- This holds in the terminal and in the VS Code extension.
- Every failure path falls back to the native dialog.

Run on 2026-10-10/11 on Linux (Ubuntu 26.04). Claude Code 2.1.292 for C1–C6, 2.1.296 for C7–C8; it auto-updated between the runs. Procedure: [Spec 03](specs/spec-03.md).

## Results

| Case | Setup | Observed | Result |
|------|-------|----------|--------|
| C1 Single choice | default | No dialog. The session showed "User answered Claude's questions: Which color? → Red, Which size? → Small". Tool result: `Your questions have been answered: "Which color?"="Red", "Which size?"="Small". You can now continue with these answers in mind.` | ✅ |
| C2 Free text | `SPIKE_MODE=freetext` | No dialog. Claude received `SPIKE-FREE-TEXT` for both questions. Claude Code switched the tool result wording to `The user answered: … Read the answers carefully — they may request clarification, changes, or that you not proceed — and follow what they actually say.` | ✅ |
| C3 Multi-select | `multiSelect: true` on color | No dialog. `"Red, Green"` was shown and reported as two listed options, using the same wording as C1, not the free-text wording | ✅ |
| C4 Delayed | `SPIKE_DELAY_MS=30000` | The session showed `running PreToolUse hook · 31s` with `esc to interrupt` available, no dialog, then the answers | ✅ |
| C5 Server down | no server | The native dialog appeared at once, with options, "Type something." and "Chat about this". Esc recorded "User declined to answer questions" | ✅ |
| C6 Wrong token | `SPIKE_TOKEN` different from config | The server logged `401`. The native dialog appeared at once | ✅ |
| C7 Timeout | hook `timeout: 15`, `SPIKE_DELAY_MS=60000` | The native dialog appeared about 17 s after the prompt (15 s timeout plus model time). The server logged `client closed before answer` and never replied | ✅ |
| C8 VS Code | C1 setup, VS Code extension | No interactive dialog. The extension rendered the questions as "Answered · 2 questions" with Red and Small selected. Claude reported the answers | ✅ |

## What this settles for ADR 02
- **Answer format:**
  - single choice: the option label;
  - multi-select: the labels joined by `", "`;
  - free text: any other string.

  Claude Code itself tells the cases apart, by checking whether the value matches the labels, and changes the tool result wording for free text. No extra field is needed.
- **Stale items:** when Claude Code gives up on a held request (timeout), it closes the connection, and the server sees it before replying. The MVP can drop the item on connection close.
- **Fail-open:** server down (connection refused), `401`, and timeout all lead to the native dialog with no blocked session.
- **Token header:** a literal header value in `settings.local.json` reaches the server unchanged (ADR 03).

## Observations for the MVP
- **Request shape.** Every payload carried:
  - `cwd`, `session_id`, `prompt_id`, `tool_use_id`, `transcript_path`, `scratchpad_dir`, `permission_mode`, `hook_event_name`, `tool_name`, `tool_input`;
  - `effort` as an object (`{"level":"high"}`), not a string.

  The payload is the same in the terminal and in VS Code.
- **Transport.** Claude Code sends requests with `user-agent: axios/1.15.2`, `content-type: application/json` and `connection: keep-alive`.
- **Option descriptions.** In this run, `description` repeated the label, because the prompt gave no descriptions. The popup must render `description` only when it differs from `label`.
- **Native dialog options to mirror:**
  - the listed options;
  - "Type something." (free text);
  - "Chat about this";
  - Esc, which records "User declined to answer questions".

  The MVP needs equivalents for free text and decline. "Chat about this" is out of scope until a return path for it is known.
- **Cancel from the terminal.** While a hook is held, the user can still press Esc in the terminal. The connection then closes, as in C7, so the inbox item must disappear.
- **Sessions started before the install (not tested).** Every case ran in a session started after its hook config was written. Whether a running session picks up hooks added later is unknown. The MVP installer should tell the user to restart open sessions until this is checked.

## Problems found during the spike
- **The test directory matters.** Two C7 attempts ran in `~/dev/claude-inbox`, which has no hook, so the native dialog appeared at once. The transcripts under `~/.claude/projects/` showed the real `cwd`. For the MVP, the hooks go in `~/.claude/settings.json`, so this cannot happen.
- **Empty token.** With `SPIKE_TOKEN` exported but empty, the server started and rejected every request. The spike now refuses to start, and the MVP installer must never write an empty token.

## Fixtures
Sanitized payloads (home directory replaced by `/home/user`) in `fixtures/hooks/`:
- `pre-tool-use.ask-user-question.single-select.json`: C1, terminal, 2.1.292.
- `pre-tool-use.ask-user-question.multi-select.json`: C3, terminal, 2.1.292.
- `pre-tool-use.ask-user-question.vscode.json`: C8, VS Code extension, 2.1.296.
