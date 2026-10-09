# Tooling

## Commands

| Command | What it does |
|---------|--------------|
| `npm run check` | Biome (format + lint), the no-comments check over every tracked script, and `tsc --noEmit` |
| `npm run fix` | Applies Biome formatting and safe fixes to the whole repository |
| `npm test -- <path>` | Runs the given test files with the Node test runner. Pass explicit paths; never run the whole suite by default |
| `npm run typecheck` | `tsc --noEmit` over `scripts/` |

## Git hooks

Husky installs the hooks on `npm install` through the `prepare` script.

**pre-commit** runs lint-staged over the staged files:

1. `biome check --write` formats, sorts imports and applies safe lint fixes. lint-staged re-stages what it changed.
2. `node scripts/no-comments.ts` rejects the commit if any staged script contains a comment.

**commit-msg** does two things:

1. commitlint validates the message against Conventional Commits (`@commitlint/config-conventional`).
2. On `main`, only `chore` commits (and merges) are accepted. Any other type must go through a branch.

## No-comments check

Code in this repository has no comments. `scripts/no-comments.ts` enforces that for `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs` and `.cjs` files.

- **Why `oxc-parser`:** the check needs a real parser. A text search would flag `//` inside a URL string, a template literal or a regular expression. TypeScript 7 is a native rewrite and no longer exposes the JavaScript compiler API (`createSourceFile`, the scanner), so it cannot be used for this. `oxc-parser` parses TypeScript, JavaScript and JSX, and returns every comment with its offsets.
- **Hashbang:** for `.js` and `.mjs` files, `oxc-parser` reports a `#!` first line as a line comment. For `.ts` files it does not. The check drops anything that starts with `#!` so both behave the same.
- **Vendored files:** files under `.claude/` come from the SatLab Protocol installer (Biome also skips `.claude/skills` and `.satlab`) and are not ours, so they are skipped. lint-staged passes absolute paths, so the check resolves each path against the repository root before comparing prefixes.
- **No escape hatch:** there is no ignore directive, because one would itself be a comment. When a linter rule fires on a test fixture that intentionally looks wrong, change the fixture.

Rust sources get their own check when the Tauri scaffold lands.
