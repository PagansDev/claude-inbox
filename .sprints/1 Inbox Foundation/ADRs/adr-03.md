# ADR 03 — Local server security

**Status:** Accepted — 2026-10-10

## Context
The hook server can approve tool calls in every Claude Code session of the user. Anything that can reach it and pass as Claude Code can inject fake questions or permission prompts, and can read what the sessions are asking. Two attackers matter:
- web pages in the user's browser, which can send requests to `localhost`;
- other processes on the machine.

Sources consulted: OWASP ASVS 5.0 through Lexomni (V2.4 anti-automation, V3.2 unintended content interpretation, V11.5 random values).

## Problem
How the server tells Claude Code apart from everything else, and what happens when it can't.

## Decision
- **Loopback only:** bind to `127.0.0.1`, never `0.0.0.0`.
- **Shared token:**
  - The installer generates 32 random bytes from the OS CSPRNG (256 bits; ASVS 11.5.1) and encodes them as hex.
  - The token is stored in the app config directory with file mode `0600`.
  - It is written as a literal header value, `X-Claude-Inbox-Token`, in the hook entries of `~/.claude/settings.json`. No environment variable is needed in the user's shell.
- **Request checks:**
  - The server rejects any request without the token, or with a wrong one, using a `401`. Comparison is constant time.
  - It requires `Content-Type: application/json`. Browsers must send a CORS preflight for that, and the server never sends CORS headers, so a web page cannot complete the request.
  - It caps the request body size and the number of pending items (ASVS 2.4.1). A rejected request is a non-2xx response, so Claude Code falls back to the native dialog.
- **Safe failure:** every rejection is a non-2xx response, so the worst case of a mistake is the native dialog, never a blocked session.
- **Rendering:** all text from hook payloads (questions, commands, file paths, notification messages) is rendered as text, never as HTML (ASVS 3.2.2). React escapes by default, and `dangerouslySetInnerHTML` is not used.

ASVS requirements consciously not applied:
- V12 (TLS): the traffic never leaves loopback.
- V3.3 (cookies): there are no cookies.

## Consequences
- A web page cannot talk to the server, and a process without the token gets a `401`.
- A process running as the same user can read `~/.claude/settings.json` and take the token. This is accepted: such a process can already edit that file or drive Claude Code directly.
- Rotating the token means re-running the installer.

## Alternatives considered
- **No token, loopback only:** any local process or web page could add items to the queue.
- **Token in an environment variable (`allowedEnvVars`):** it only works when the variable is set in every shell and IDE that launches Claude Code, which is fragile. It is not safer than a literal header in a user-only file.
- **Unix domain socket:** HTTP hooks only take a URL, and Unix sockets are not portable to Windows.
