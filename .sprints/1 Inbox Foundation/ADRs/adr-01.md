# ADR 01 — Stack and process architecture

**Status:** Accepted — 2026-10-10

## Context
claude-inbox is a desktop app that must be running in the background to receive Claude Code hook requests, hold each one open until the user answers, and show a popup with native notifications. It targets Linux first and must stay portable to macOS and Windows.

Sources consulted:
- Context7: Tauri v2 docs (`/websites/tauri_app`, `/tauri-apps/plugins-workspace`) and axum docs (`/tokio-rs/axum`).
- Lexomni: the maintainer's guidelines. They prescribe Tailwind for styling, `lucide-react` for icons (never emoji), YAGNI and DRY, and "the controller is the gatekeeper, business rules live in the service".

## Problem
Which runtime hosts the HTTP server and the UI, and how do the two talk to each other?

## Decision
**One Tauri v2 process.**

- **Backend (Rust):**
  - An axum HTTP server runs inside the Tauri process. It is started from the `setup` hook with `tauri::async_runtime::spawn` and shares the queue with Tauri commands through managed state (`app.manage`).
  - axum handlers only parse, authenticate and validate. The queue and the decision logic live in plain Rust modules with no axum or Tauri types, so they can be unit tested.
- **Frontend (TypeScript):**
  - React, built by Vite, styled with Tailwind CSS, icons from `lucide-react`.
  - It receives queue changes as Tauri events (`emit`) and answers through Tauri commands (`invoke`).
- **Official plugins:**
  - `tauri-plugin-single-instance`: a second launch focuses the running app instead of failing to bind the port.
  - `tauri-plugin-notification`: native notifications.
  - The tray icon comes in the MVP.
- **Tooling:** Node 24 for the frontend toolchain and dev scripts; Rust stable for the backend.

## Consequences
- Small binary and low idle memory for an app that is always running.
- The server and the UI share memory, so there is no second process to supervise and no IPC protocol of our own.
- Linux builds need `webkit2gtk-4.1` and `libsoup-3.0`. Tray icons on GNOME need the AppIndicator extension.
- Two toolchains (Rust and Node) in one repository. The git hooks gain rustfmt and clippy.

## Alternatives considered
- **Electron:** a single language (TypeScript) for everything, but much higher idle memory for a background app.
- **Next.js frontend:** the maintainer's default for web apps. Rejected here because a Tauri webview loads a static bundle: there is no server runtime, so server components and the App Router bring no benefit. React, Tailwind and `lucide-react` are kept.
- **A separate server process (Node or Rust) plus a UI app:** two processes to start, supervise and keep in sync, for no gain.
