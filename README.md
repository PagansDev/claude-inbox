# claude-inbox

**One inbox for every Claude Code session.**

When you run several Claude Code sessions at once (in different repositories, in the terminal, VS Code or the desktop app), their questions and permission requests wait in whichever window asked them. claude-inbox is a local desktop app that collects them into one queue and lets you answer from a single popup.

> **Status:** early development. Nothing is usable yet. The current work is tracked in [#1 Inbox Foundation](https://github.com/PagansDev/claude-inbox/issues/1).

## How it works

claude-inbox uses [Claude Code hooks](https://code.claude.com/docs/en/hooks) of type `http`, configured once in `~/.claude/settings.json` so they apply to every repository:

| Hook event | What the inbox does |
|------------|---------------------|
| `PreToolUse` on `AskUserQuestion` | Shows the question with its options and sends your answer back to Claude |
| `PermissionRequest` | Shows the tool and its command or file, with Allow and Deny |
| `Notification` | Shows general notices from a session |
| `Stop` | Marks a session as waiting for your next prompt |

Each pending request becomes one item in a FIFO queue. The app keeps the HTTP request open until you answer.

If the app is not running, the hook fails to connect. Claude Code treats that as a non-blocking error and falls back to its normal dialog, so sessions never get stuck.

## Planned features

- Popup with the repository name, a short session id and the question, honouring multi-select and free-text answers
- Allow and Deny for permission requests
- Native desktop notifications and a pending counter
- Indicator for sessions waiting on your next prompt
- Command to install and remove the hook configuration without touching your existing hooks
- Interface in English, Portuguese (Brazil) and Spanish

Out of scope for now: starting or managing sessions, persistent history, and sync between machines.

## Platforms

Linux first. The code avoids platform-specific APIs so macOS and Windows can follow.

## Stack

[Tauri v2](https://v2.tauri.app/) with a Rust backend that hosts the local hook server, and a TypeScript frontend.

## Development

- Setup, running and building the desktop app: [`docs/desktop-app.md`](docs/desktop-app.md)
- Commands, git hooks and the no-comments check: [`docs/tooling.md`](docs/tooling.md)

## Contributing

- Code, commits and documentation are written in English. The interface is translated.
- No comments in code. Explanations belong in [`docs/`](docs/).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- Only `chore` commits go directly to `main`. Other work goes through a branch and a pull request.

## License

[MIT](LICENSE)
