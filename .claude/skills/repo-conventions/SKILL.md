---
name: repo-conventions
description: The house rules of the claude-inbox repository and how the tooling enforces them — no code comments (explanations go to docs/), English everywhere except UI translations, typed i18n catalogues, commit and branch rules, and the traps of the no-comments check. TRIGGER when writing or editing any code, test, config or UI string in this repository; when adding a language, a dependency with install scripts, or a new file type; when a pre-commit hook rejects a commit. SKIP for reading-only questions.
---

# claude-inbox repository conventions

Decided in ADR 04 (`.sprints/1 Inbox Foundation/ADRs/adr-04.md`) and enforced by the git hooks described in `docs/tooling.md`.

## No comments in code

- No comments of any kind in `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`, `.mts`, `.cts` or `.rs`. That includes doc comments (`/** */`, `///`, `//!`) and directives such as `// @ts-expect-error` or `// biome-ignore`.
- Anything that would have been a comment goes to `docs/`, linked from `docs/README.md`. The reason behind generated code (for example `windows_subsystem` in `main.rs`) goes there too.
- The check is `scripts/no-comments.ts`:
  - `oxc-parser` for TS/JS;
  - `@ast-grep/napi` + `@ast-grep/lang-rust` for Rust.

  It parses for real, so `//` inside strings, regexes, templates and Rust raw strings is fine.
- **There is no escape hatch.** When a lint rule fires on a fixture that is wrong on purpose, change the fixture. Do not add an ignore comment, because the ignore would itself be a comment.
- Generated files (`tauri init`, scaffolds) arrive with comments. Remove them and document what they said.
- Files under `.claude/` are vendored and skipped.

## Language

- Code, identifiers, commits, docs, ADRs, PRDs, specs and issues are in **English**.
- The UI is translated into `en`, `pt-BR` and `es`.
- Chat with the maintainer is in Portuguese.

## UI text and i18n

- No on-screen string is hard-coded. Every one lives in `src/i18n/`.
- `en.ts` is the source, and its keys define `Messages`. `pt-BR.ts` and `es.ts` are typed `Messages`, so a missing or extra key fails `npm run typecheck`. To add a string, add it to `en.ts`, then follow the `tsc` errors.
- Components read text through `useMessages()`, which works only inside `I18nProvider`.
- The brand name `claude-inbox` stays untranslated and carries `translate="no"`.
- Screen text is the maintainer's decision. Put new strings in the spec as a table for approval.
- No plural helper exists yet. The first string with a count uses `Intl.PluralRules`.

## Commits and branches

- Use Conventional Commits in the form `type(scope): description(#issue)`. The description says what the commit changed, not the issue title.
- On `main`, only `chore` (and merges) are allowed; the `commit-msg` hook blocks the rest. Other work goes on a `feat-*` or `fix-*` branch.
- No AI attribution and no `Co-Authored-By`.
- The maintainer approves every commit message before the commit. Stage explicit paths, never `git add .`.
- Push and merge belong to the maintainer.

## What the pre-commit hook runs

- Every staged file: `biome check --write`, then the no-comments check.
- A staged `.rs` file: `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings`, once for the whole crate. They read the **working tree**, so an unrelated unstaged `.rs` file can block a commit (accepted, REVIEW R1).
- Commits that only touch TS/JS never start cargo.

## Traps already hit

- **TypeScript 7** is native and has **no JavaScript compiler API**. Do not reach for `ts.createSourceFile`.
- **npm blocks install scripts.** Review each one with `npm install-scripts ls`. Deny it when the package ships prebuilt binaries (`@ast-grep/lang-rust` is denied in `allowScripts`).
- **Biome needs `css.parser.tailwindDirectives: true`** to parse Tailwind v4 `@theme`.
- **lint-staged passes absolute paths.** Path checks must resolve against the repo root.
- **`oxc-parser` reports a `#!` line as a comment in `.js`/`.mjs` but not in `.ts`.** The check drops hashbangs.
- **New Rust toolchains may lack `rustfmt` and `clippy`.** Install them with `rustup component add rustfmt clippy`.
- **Run only the affected tests, by path:**
  - `npm run test:web -- <path>`;
  - `npm run test:scripts -- <path>`;
  - `npm run test:rust`.
