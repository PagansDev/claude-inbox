# Task 04 — Tauri scaffold

> Activated on 2026-10-11. Original roadmap row: "Tauri v2 app (Rust backend, React + Vite + Tailwind + lucide-react frontend) building on Linux, with the ADR 04 folder layout; rustfmt, clippy and a Rust no-comments check in the git hooks".

## Objective
A Tauri v2 desktop app that opens a window on Linux, built from a React + Vite + Tailwind + lucide-react frontend. The git hooks hold Rust to the same rules as TypeScript: formatted, lint-clean, no comments.

## Context at activation
- Task 03 proved the hook integration. Nothing it found changes the scaffold; its findings target the MVP (Task 03 Record).
- The repository root already has `package.json` (Biome, Husky, lint-staged, commitlint, TypeScript 7, oxc-parser), a `tsconfig.json` for `scripts/` and `spike/`, and `scripts/no-comments.ts` for TS/JS.
- System libraries for Tauri are installed (webkit2gtk 2.52.6, libsoup 3.6.6). Rust: cargo 1.99.
- Context7 (Tauri v2 docs): add Tauri to an existing project with `@tauri-apps/cli` and `tauri init`, which has non-interactive flags. The recommended Vite config uses a fixed port, ignores `src-tauri` in watch, and targets `safari13` on Linux.
- `tauri init` generates Rust files with comments (for example the `windows_subsystem` note in `main.rs`). They must be removed, and their content moved to `/docs`.

## Scope
- In:
  - Vite + React + TypeScript frontend in `src/`, with Tailwind v4 (`@tailwindcss/vite`) and `lucide-react`;
  - `src-tauri/` from `tauri init`;
  - a placeholder window;
  - TypeScript config split between the browser code and the Node tooling;
  - Vitest + Testing Library set up with one component test;
  - the Rust no-comments check;
  - rustfmt and clippy in the pre-commit hook;
  - `/docs` updates.
- Out:
  - the hook server, queue, tray and notifications (MVP);
  - i18n (Task 05; the placeholder text is replaced there);
  - empty module folders from ADR 04, which are created when their code lands (YAGNI);
  - bundling installers (`.deb`, AppImage).

## Steps
1. Install the frontend and Tauri dependencies with exact versions.
2. Run `tauri init` with flags. Remove generated comments, and document what they said in `docs/`.
3. Write the Vite config, `index.html`, `src/main.tsx`, `src/App.tsx` and Tailwind entry CSS.
4. Split the TypeScript config: `tsconfig.json` for `src/` (DOM, JSX) and `tsconfig.node.json` for tooling. `npm run typecheck` covers both.
5. Set up Vitest + Testing Library + jsdom.
6. Extend `scripts/no-comments.ts` to `.rs` through `@ast-grep/napi` + `@ast-grep/lang-rust`, test first.
7. Move lint-staged config to `lint-staged.config.js`, so Rust files trigger `cargo fmt --check` and `cargo clippy` once per commit, not once per file.
8. Run the app, build it, and commit through the real hooks.

## Acceptance Criteria
- [ ] `npm run tauri dev` opens a window titled `claude-inbox` that shows the placeholder screen with a lucide icon, styled by Tailwind.
- [ ] `npm run tauri build -- --no-bundle` succeeds.
- [ ] `npm run check` passes: Biome, the no-comments check on TS/JS/Rust, and typecheck of both configs.
- [ ] `cargo fmt --check` and `cargo clippy -- -D warnings` pass on `src-tauri`.
- [ ] A staged `.rs` file with a comment, a formatting issue or a clippy warning blocks the commit.
- [ ] No generated comment survives in `src-tauri/`. What they explained is in `docs/`.

## Test Strategy
- `node --test` on `scripts/no-comments.test.ts`, with new Rust cases written first.
- Vitest component test: `App` renders the placeholder heading.
- Manual: run the app, run the build, and try a blocked commit in a throwaway clone, as in Task 02.

## Dependencies
- Task 02 (tooling).
- ADR 01 (stack), ADR 04 (structure and conventions), ADR 05 (testing).

## Shared files
- `package.json` (scripts, dependencies).
- `tsconfig.json`.
- `biome.json`.
- `.gitignore`.
- `docs/tooling.md`, `docs/README.md`.
- Sprint `README.md` (roadmap row).

## Spec and ADRs
- Spec: [Spec 04](../specs/spec-04.md)
- ADRs: [ADR 01](../ADRs/adr-01.md), [ADR 04](../ADRs/adr-04.md), [ADR 05](../ADRs/adr-05.md)

## Progress
- [x] Spec written and reviewed
- [x] Tests written and RED confirmed (Rust cases in `scripts/no-comments.test.ts`, `src/App.test.tsx`)
- [x] GREEN
- [x] Refactor
- [x] Affected specs, lint, typecheck and build passing

## Record
Closed on 2026-10-11.

**Delivered**
- Tauri v2 app: crate `claude-inbox`, identifier `dev.pagans.claude-inbox`, a 480×640 `main` window and a strict CSP.
- React 19 + Vite 8 + Tailwind 4.3 + lucide-react frontend with a placeholder screen.
- Vitest 5 + Testing Library with the `App` test.
- `tsconfig.json` (browser) split from `tsconfig.node.json` (tooling).
- The no-comments check now covers Rust through `@ast-grep/napi` + `@ast-grep/lang-rust` (17 tests).
- `lint-staged.config.js` runs `cargo fmt --check` and `cargo clippy -D warnings` once per commit when Rust is staged.
- `docs/desktop-app.md` and an updated `docs/tooling.md`.

**Verification**
- `npm run tauri build -- --no-bundle` produced an 11 MB release binary. The first clippy compile took about 50 s; the release build took about 1 min 35 s.
- The binary stayed up for 8 s with no errors.
- In a throwaway clone with the real hooks:
  - a Rust comment (F1), unformatted Rust (F2) and a clippy warning (F3) were each blocked;
  - a TypeScript-only commit did not start cargo (S5).
- `npm run check` passes.

**Differences from the task as written**
- `rustfmt` and `clippy` were not installed in the toolchain. They were added with `rustup component add rustfmt clippy`, and `docs/desktop-app.md` lists them as prerequisites.
- Three Rust no-comments cases started green, because `oxc-parser` also reads `//` in a `.rs` file as a JavaScript comment. They became meaningful once `.rs` files went to the Rust parser.
- Biome needed `css.parser.tailwindDirectives` to parse `@theme`.
- npm now blocks install scripts. The script of `@ast-grep/lang-rust` was denied because the package ships prebuilt binaries.
- `frontend-master` asks for a bold aesthetic direction, and the maintainer's UX guidelines ask for clarity and predictability. The guidelines win. The real visual direction is decided with the MVP screens.

**What the next tasks need to know**
- Task 05 replaces the two hard-coded strings in `src/App.tsx` and their assertions in `src/App.test.tsx`.
- Colours are theme tokens in `src/index.css`.
- The CSP blocks external fonts and images.
