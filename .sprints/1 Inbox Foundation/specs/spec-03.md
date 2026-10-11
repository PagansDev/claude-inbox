# Spec 03 — Hook viability spike

## Requirement
When Claude Code calls `AskUserQuestion` in a directory whose `.claude/settings.local.json` has an `http` `PreToolUse` hook with matcher `AskUserQuestion` pointing at the spike server, and the request carries the right token, the server must reply `permissionDecision: "allow"` with `updatedInput` holding the original `questions` plus an `answers` map. Claude must then continue with those answers and no native question dialog.

## Server behaviour
- Listens on `127.0.0.1:${SPIKE_PORT:-7777}` only.
- Token: `SPIKE_TOKEN`, or a random 32-byte hex value generated at start. Requests whose `X-Claude-Inbox-Token` header differs get a `401` with an empty body.
- Appends every request (headers without the token, plus the body) to `spike/payloads.jsonl`.
- `POST /hooks/pre-tool-use` with `tool_name` `AskUserQuestion`:
  - waits `SPIKE_DELAY_MS` (default `0`);
  - builds `answers` according to `SPIKE_MODE`:
    - `first` (default): the first option label of each question. When `multiSelect` is true, the first two labels joined by `", "`.
    - `freetext`: the string `SPIKE-FREE-TEXT` for every question.
  - replies `200` with:
    ```json
    {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","updatedInput":{"questions":[...],"answers":{...}}}}
    ```
- Any other path or tool replies `200` with an empty body, so the native flow continues.
- If the client closes the connection before the reply, it logs `client closed before answer` with the session id.
- On start, it prints the `.claude/settings.local.json` content to use, with the URL, header and timeout filled in.

## Hook config printed by the server

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "http",
            "url": "http://127.0.0.1:7777/hooks/pre-tool-use",
            "timeout": 3600,
            "headers": { "X-Claude-Inbox-Token": "<token>" }
          }
        ]
      }
    ]
  }
}
```

## Manual procedure
Test directory: `~/dev/claude-inbox-spike-test` (outside the repository), with the printed config saved as `.claude/settings.local.json`. Start a **new** Claude Code session in it for each config change.

Prompt for C1–C7:
> Use the AskUserQuestion tool to ask me two questions: "Which color?" with options Red, Green, Blue, and "Which size?" with options Small, Large. Then tell me exactly what answers you received.

For C3, ask for `multiSelect: true` on "Which color?".

| Case | Server setup | Expected |
|------|--------------|----------|
| C1 Single choice | `npm run spike` | No dialog. Claude reports Red and Small. The payload is logged |
| C2 Free text | `SPIKE_MODE=freetext` | No dialog. Claude reports `SPIKE-FREE-TEXT` for both |
| C3 Multi-select | default, prompt asks for multi-select on color | No dialog. Claude reports Red and Green for color |
| C4 Delayed | `SPIKE_DELAY_MS=30000` | The session waits about 30 s without a dialog, then Claude reports the answers |
| C5 Server down | server stopped | The native dialog appears right away |
| C6 Wrong token | server started with a `SPIKE_TOKEN` different from the config | The server logs a `401`. The native dialog appears |
| C7 Timeout | config `timeout: 15`, `SPIKE_DELAY_MS=60000` | The native dialog appears after about 15 s. The server logs whether the client closed before answering |
| C8 VS Code | C1 setup, session opened in the VS Code extension | Same as C1. Record whether a native dialog flashes or appears alongside |

## Failure cases
- `answers` is ignored and the native dialog appears anyway. Record the surface, then try `permissionDecision: "defer"` as ADR 02 names.
- Claude receives the answer in a different shape than sent (for example, the multi-select separator). Record the exact text.
- The header never reaches the server (every request gets a `401`). Record it and re-check ADR 03.

## Contracts involved
- `PreToolUse` input and output as quoted in ADR 02.
- `X-Claude-Inbox-Token` header from ADR 03.

## Expected states
- `listening`
- `request held` (delay)
- `answered`
- `rejected (401)`
- `client closed before answer`

## Out of scope
- `PermissionRequest`, `Notification` and `Stop`.
- Queueing several requests.
- Any UI.
- Production error handling.
