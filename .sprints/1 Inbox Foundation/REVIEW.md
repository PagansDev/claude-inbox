# Code Review Report — 1 Inbox Foundation

Date: 2026-10-12 · Branch: `feat-inbox-foundation` at `5c52e3d` (plus the `chore` commits on `main` from `40919fb`)

## Context
**Objective.** Lay the foundation of claude-inbox and prove the hook integration (PRD, issue #1).

**Files reviewed.**
- Tooling: `.husky/`, `lint-staged.config.js`, `commitlint.config.js`, `biome.json`, `package.json`, both `tsconfig` files.
- `scripts/no-comments.ts` and its tests.
- `spike/server.ts`.
- Frontend: `index.html`, `vite.config.ts`, `src/` (`App`, `main`, `i18n/`, `index.css`).
- Tauri: `src-tauri/` (`Cargo.toml`, `tauri.conf.json`, `capabilities/`, `src/`).
- `docs/`.

**Scope.** Greenfield. There is no product logic yet: the code is tooling, a throwaway spike, a scaffold and the i18n base.

## Architecture Review
✔ **Rules are enforced by tooling, not by memory.** Comments, formatting, lint, the commit format and the `chore`-only rule on `main` are all checked by hooks, and each was verified in a throwaway clone.
✔ **Logic stays out of components.** `resolveLocale` is a pure function, tested without a DOM. `App` only renders.
✔ **Catalogue completeness is checked at compile time** (`Messages` type), with no runtime cost.
✔ **The browser and Node tsconfigs are separate**, so DOM types cannot leak into tooling or the other way round.
✔ **The Tauri surface is minimal:** only `core:default` permissions, a strict CSP, and no unused plugins or crates.
⚠ **The spike server lives inside the typechecked tree** (`tsconfig.node.json`, Biome) even though it is throwaway. That is fine while it exists, but ADR 04 requires deleting it when the MVP server lands. If it is not deleted, it becomes code with no owner.

## Code Quality

| # | Severity | Where | Finding |
|---|----------|-------|---------|
| R1 | 🟡 MEDIUM | `lint-staged.config.js:9-12` | `cargo fmt --check` and `cargo clippy` check the **working tree**, not the staged snapshot. lint-staged only hides unstaged changes in *partially staged* files, so an unstaged or untracked `.rs` file elsewhere in the crate is still compiled. Result: a broken unstaged file blocks an unrelated commit (false block), and a staged file that only compiles thanks to an unstaged change gets through (false pass). |
| R2 | 🟢 LOW | `.husky/commit-msg:6` | The `chore`-only guard on `main` accepts any subject starting with `Merge `. A non-chore commit typed as `Merge foo` passes. The hook is a local convenience; the real control would be branch protection on GitHub. |
| R3 | 🟢 LOW | `src/main.tsx:11-13` | If `#root` is missing, the app silently renders nothing. A missing root is a build defect and should fail loudly (throw). |
| R4 | 🟢 LOW | `src/App.test.tsx` (`useMessages` test) | The expected throw makes React print an error stack to stderr, which looks like a failure in the test output. Silence `console.error` for that test. |
| R5 | 🟢 LOW | `src-tauri/tauri.conf.json` (`bundle.targets: "all"`) | `npm run tauri build` without `--no-bundle` tries every Linux format (deb, rpm, AppImage), and some need extra system tools. Pin the targets when packaging is decided. |
| R6 | 🟢 LOW | `README.md` | It does not say how to set up or run the project. `docs/desktop-app.md` has that; the README should link to it. |

No large functions, no deep nesting, no duplicated logic and no magic numbers outside configuration.

## Interface audit (Web Interface Guidelines, fetched 2026-10-12)

### src/index.css
- `src/index.css:13` — no `color-scheme: dark` on the root while the UI is dark. Native scrollbars and future form controls will render light.

### src/App.tsx
- `src/App.tsx:9` — the brand name in `<h1>` has no `translate="no"`. Browser and OS translators may "translate" `claude-inbox`.

### index.html
- ✓ pass. `lang` starts as `en` and is replaced at start-up by the resolved locale.

### src/i18n/*, src/main.tsx
- ✓ pass. Language comes from browser settings, and every string is in the catalogues.

## Maintainability
- **A new developer can find out why.** Every non-obvious choice is in `docs/` or an ADR: the oxc vs ast-grep split, the hashbang quirk, absolute paths in lint-staged, `windows_subsystem`, the CSP, the denied install script.
- **The i18n API is small** (`I18nProvider`, `useMessages`) and has a documented path to plurals and an override.
- **Risk:** `scripts/no-comments.ts` now carries two parsers. When a third language arrives, the extension → parser routing should become a table, not a longer ternary. That is not needed yet.

## Risk Analysis
- No broken imports. `npm run check`, both typechecks, 17 + 13 tests and the release build all pass.
- `appName` repeated in three catalogues is intentional (the brand, always the same). If it ever needs to change, it must change in all three, and `tsc` will not catch a mismatch, only a missing key.
- `fixtures/hooks/` holds real payloads with user prompts. They were sanitized of personal paths and contain only test prompts.

## Performance
- No concerns. The bundle is 224 kB of JS (70 kB gzip), almost all React. Clippy takes about 50 s on a cold build and is incremental afterwards. It only runs when Rust is staged.

## Improvement Suggestions
1. **R1 (MEDIUM):** accept it for now and record it in `docs/tooling.md`, or run cargo against the index (stash unstaged with `git stash --keep-index --include-untracked` in a wrapper script). Recommended: document now and revisit if it bites, because the wrapper adds risk to every commit.
2. **R2:** enable branch protection on `main` (require a PR) and keep the hook as fast feedback.
3. **R3:** throw `new Error("Root element #root not found")` in `main.tsx`.
4. **R4:** wrap the throw test with `vi.spyOn(console, "error").mockImplementation(() => {})` and restore it afterwards.
5. **R5:** set `bundle.targets` explicitly when packaging is planned. Until then, document `--no-bundle` (already in `docs/desktop-app.md`).
6. **R6:** add a "Development" line to the README that points to `docs/desktop-app.md` and `docs/tooling.md`.
7. **UI:** add `color-scheme: dark` to `html` in `src/index.css`, and `translate="no"` to the brand heading.

## Decisions (maintainer, 2026-10-12)

| Finding | Decision | Where |
|---------|----------|-------|
| R1 | Accepted, not documented. The maintainer did not choose "document" | — |
| R2 | Accepted. No branch protection for now | — |
| R3 | Fixed: `main.tsx` throws `Root element #root not found` | Task 06 |
| R4 | Fixed: the expected-throw test silences `console.error` | Task 06 |
| R5 | Accepted. `--no-bundle` stays documented in `docs/desktop-app.md` | — |
| R6 | Fixed: the README has a Development section | Task 06 |
| UI `color-scheme` | Fixed: `color-scheme: dark` on `html` | Task 06 |
| UI `translate="no"` | Fixed: brand heading, covered by the `App` tests | Task 06 |

## Summary
The foundation is sound. The rules the maintainer set are enforced mechanically, the hook integration is proven on real sessions, and the scaffold is minimal and secure by default. Nothing blocks the merge. R1 is the only finding with a real chance of confusing someone, and it is a tooling edge case, not a product defect. Every finding goes to the maintainer to decide.
