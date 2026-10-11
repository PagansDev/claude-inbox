# Tooling

## Commands

| Command | What it does |
|---------|--------------|
| `npm run check` | Biome (format + lint), the no-comments check over every tracked TS/JS/Rust file, and the typecheck |
| `npm run fix` | Applies Biome formatting and safe fixes to the whole repository |
| `npm run typecheck` | `tsc --noEmit` on `tsconfig.json` (browser code in `src/`) and on `tsconfig.node.json` (tooling: `scripts/`, `spike/`, config files) |
| `npm run test:web -- <path>` | Vitest (jsdom + Testing Library) for frontend tests |
| `npm run test:scripts -- <path>` | Node test runner for `scripts/` |
| `npm run test:rust` | `cargo test` on `src-tauri` |

Pass explicit test paths. Do not run a whole suite by default.

## TypeScript configs

- `tsconfig.json` is the browser config: DOM types, `react-jsx`, bundler resolution, and `vite/client` types. It covers `src/`.
- `tsconfig.node.json` is the Node config: Node types and `nodenext` resolution, with `.ts` imports allowed so Node 24 can run the files directly. It covers `scripts/`, `spike/`, `vite.config.ts`, `commitlint.config.js` and `lint-staged.config.js`.

## Git hooks

Husky installs the hooks on `npm install` through the `prepare` script.

**pre-commit** runs lint-staged (`lint-staged.config.js`) over the staged files:

1. For every file:
   - `biome check --write` formats, sorts imports and applies safe lint fixes. lint-staged re-stages what it changed.
   - `node scripts/no-comments.ts` rejects the commit if a staged TS, JS or Rust file contains a comment.
2. Only when a `.rs` file is staged:
   - `cargo fmt --check`;
   - `cargo clippy --all-targets -- -D warnings`.

   The Rust step is a function in the config, so cargo runs once for the whole crate instead of once per file. A commit without Rust files never starts cargo.

**commit-msg** does two things:

1. commitlint validates the message against Conventional Commits (`@commitlint/config-conventional`).
2. On `main`, only `chore` commits (and merges) are accepted. Any other type must go through a branch.

## No-comments check

Code in this repository has no comments. `scripts/no-comments.ts` enforces that for `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs` and `.rs` files.

- **Why real parsers:** a text search would flag `//` inside a URL string, a template literal, a regular expression or a Rust raw string.
- **TypeScript and JavaScript use `oxc-parser`:** TypeScript 7 is a native rewrite and no longer exposes the JavaScript compiler API (`createSourceFile`, the scanner), so it cannot be used for this. `oxc-parser` parses TypeScript, JavaScript and JSX, and returns every comment with its offsets.
- **Rust uses `@ast-grep/napi` with `@ast-grep/lang-rust`:** the tree-sitter Rust grammar reports `line_comment` and `block_comment` nodes. Those include doc comments (`///`, `//!`, `/** */`), but not attributes (`#[...]`, `#![...]`), strings or raw strings.
- **Install script of `@ast-grep/lang-rust`:** its `postinstall` only compiles the parser when no prebuilt binary exists. The package ships prebuilds for Linux, macOS and Windows on x64 and arm64, so the script is denied in `package.json` (`allowScripts`).
- **Hashbang:** for `.js` and `.mjs` files, `oxc-parser` reports a `#!` first line as a line comment. For `.ts` files it does not. The check drops anything that starts with `#!` so both behave the same.
- **Vendored files:** files under `.claude/` come from the SatLab Protocol installer and are not ours, so they are skipped. Biome also skips `.claude/skills` and `.satlab`. lint-staged passes absolute paths, so the check resolves each path against the repository root before comparing prefixes.
- **No escape hatch:** there is no ignore directive, because one would itself be a comment. When a linter rule fires on a test fixture that intentionally looks wrong, change the fixture.

## Biome and Tailwind

`css.parser.tailwindDirectives` is on in `biome.json`, so Biome parses Tailwind v4 syntax (`@theme`, `@utility`, `@apply`) in `src/index.css`.
