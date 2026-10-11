# Spec 04 — Tauri scaffold

## Requirement
When the developer runs `npm run tauri dev` in a fresh clone (after `npm install`, with the Tauri system libraries installed), the app must open a desktop window titled `claude-inbox` that shows a placeholder screen built with React, styled by Tailwind and showing a `lucide-react` icon. When a commit stages Rust files, the git hooks must reject comments, unformatted code and clippy warnings, just as they already do for TypeScript.

## Success cases
- **S1:** `npm run tauri dev` opens the window. The placeholder shows a heading, `claude-inbox`, and an inbox icon from `lucide-react`. The Tailwind classes visibly apply.
- **S2:** `npm run tauri build -- --no-bundle` produces the release binary.
- **S3:** `npm run check` passes:
  - Biome;
  - the no-comments check over tracked `.ts`, `.tsx`, `.js` and `.rs` files;
  - `tsc` on the browser config and on the tooling config.
- **S4:** `npm run test:web` runs Vitest and the `App` test passes.
- **S5:** a commit that stages only TypeScript files does not run cargo.

## No-comments check for Rust
`findComments("x.rs", source)` returns every Rust comment with its line number:

| Input | Reported |
|-------|----------|
| `// note` | yes |
| `/* block */` | yes |
| `/// doc` and `//! inner doc` | yes |
| `/** doc */` | yes |
| `let url = "https://example.com";` | no |
| `let raw = r#"// not a comment"#;` | no |
| `let c = '/';` | no |
| `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` | no |
| `#[tauri::command]` | no |
| a file with no comments | empty list |

## Pre-commit behaviour with Rust staged
- `cargo fmt --check` on `src-tauri`, once per commit.
- `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`, once per commit.
- The no-comments check on the staged `.rs` files.
- Any failure blocks the commit with the tool's output.

## Failure cases
- **F1:** a staged `.rs` file containing `// todo` makes the commit fail and print `<path>:<line> // todo`.
- **F2:** a staged `.rs` file that is not rustfmt-formatted makes the commit fail.
- **F3:** a staged `.rs` file with an unused variable makes the commit fail with clippy's `-D warnings` error.
- **F4:** if port 1420 is taken, `npm run tauri dev` fails at once instead of picking another port (`strictPort`).

## Contracts involved
- The `tauri.conf.json` build section:
  - `devUrl`: `http://localhost:1420`;
  - `frontendDist`: `../dist`;
  - `beforeDevCommand`: `npm run dev`;
  - `beforeBuildCommand`: `npm run build`.
- The Vite config from the Tauri docs:
  - `clearScreen: false`;
  - `strictPort`;
  - `src-tauri` ignored in watch;
  - `envPrefix` `VITE_` and `TAURI_ENV_*`;
  - target `safari13` on Linux and macOS.
- The window: title `claude-inbox`, identifier `dev.pagans.claude-inbox`.

## Expected states
- `window open`
- `build ok`
- `commit blocked`
- `commit accepted`

## Out of scope
- Hook server, queue, tray and notifications.
- i18n: the placeholder text is hard-coded until Task 05 replaces it.
- Installer bundles.
- macOS and Windows builds.
