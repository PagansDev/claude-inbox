# ADR 04 — Repository conventions and structure

**Status:** Accepted — 2026-10-10

## Context
The maintainer set these rules before any code was written:
- everything in English except the UI translations;
- no code comments, with explanations in `/docs`;
- UI in pt-BR, en and es;
- Conventional Commits, with only `chore` commits directly on `main`.

The tooling for comments and commits already exists (see `docs/tooling.md`).

The maintainer's Lexomni guidelines also apply: YAGNI, DRY, the controller is the gatekeeper with rules in the service, and reusable components. Their rule "don't write loose `.md` files, use Lexomni notes" covers knowledge-base content only. Project documentation lives in `/docs`.

## Problem
Where things go, how they are named, and how the conventions are enforced.

## Decision

**Language**
- Code, identifiers, commits, docs, ADRs, PRDs and issues are in English. Chat with the maintainer is in Portuguese.

**No comments**
- Enforced by `scripts/no-comments.ts` in the pre-commit hook for TypeScript and JavaScript.
- Rust gets an equivalent check in Task 04.
- Anything that would be a comment goes to `/docs`, linked from `docs/README.md`.

**i18n**
- Each locale is a plain TypeScript catalogue: `src/i18n/en.ts` is the source, and `pt-BR.ts` and `es.ts` are typed against it. A missing or extra key is a type error, so `tsc` guarantees completeness.
- Plurals use `Intl.PluralRules`.
- The locale comes from `navigator.language`, falls back to `en`, and can be overridden in settings (MVP).
- No i18n library, because three static catalogues do not need one (YAGNI).

**Commits and branches**
- Conventional Commits in the form `type(scope): description(#issue)`.
- Only `chore` on `main`; other work goes on `feat-*` or `fix-*` branches.
- No AI attribution.
- Push and merge are the maintainer's.

**Structure**

```
src/                  React frontend
  components/         presentational components, no data access
  features/<name>/    a feature's components and hooks (e.g. features/inbox)
  i18n/               catalogues and the t() helper
src-tauri/src/
  server/             axum router and handlers: parse, authenticate, validate, delegate
  hooks/              hook payload and response types (the contract in ADR 02)
  queue/              pending items, ordering, answer and cancel rules (no axum, no Tauri)
  installer/          settings.json merge and token generation
  commands.rs         Tauri commands called by the frontend
scripts/              repository tooling
spike/                Task 03 only; deleted when the MVP server replaces it
docs/                 everything that would otherwise be a comment
```

**Naming**
- Rust: `snake_case` modules named by responsibility.
- TypeScript: `PascalCase.tsx` for components, `useThing.ts` for hooks, `kebab-case.ts` for everything else.

## Consequences
- The type checker enforces translation completeness, so no runtime check is needed.
- Business rules in `queue/` and `installer/` are testable without a server or a window.
- A temporary debug or test file is deleted after use, per the maintainer's guidelines. The spike folder follows the same rule.

## Alternatives considered
- **react-i18next:** mature, but it brings runtime key lookup with no compile-time completeness check. That is more than three static catalogues need.
- **The `{name}.service.ts` / `{name}.controller.ts` naming from the maintainer's guidelines:** it was written for Node backends. Here the backend is Rust, so the same split is kept as modules (`server/` is the controller, `queue/` is the service).
