# Task 05 — i18n skeleton

> Activated on 2026-10-11. Original roadmap row: "Typed pt-BR, en and es catalogues (missing key = type error), `navigator.language` detection with `en` fallback, scaffold window rendering only catalogue text".

## Objective
Every piece of text on screen comes from a typed catalogue in English, Brazilian Portuguese or Spanish. The language follows the system's preferred languages and falls back to English. A catalogue with a missing or extra key fails the typecheck.

## Context at activation
- Task 04 delivered the React + Vite + Tailwind app. `src/App.tsx` has two hard-coded strings: `claude-inbox` and `No pending questions.`. `src/App.test.tsx` asserts both.
- ADR 04 fixes the approach:
  - plain TypeScript catalogues, with `en.ts` as the source and `pt-BR.ts` and `es.ts` typed against it;
  - `navigator.language` detection with `en` fallback;
  - `Intl.PluralRules` for plurals;
  - no i18n library;
  - a settings override later (MVP).
- No string needs a plural or a parameter yet.

## Scope
- In:
  - `src/i18n/` with the three catalogues, locale resolution, and a React provider and hook;
  - `App` reading its text from the catalogue;
  - `<html lang>` set to the active locale.
- Out:
  - plurals and interpolation, because no string needs them yet (YAGNI). They come with the first string that does, using `Intl.PluralRules` per ADR 04;
  - the language override in settings (MVP);
  - translating anything outside the UI.

## Steps
1. Write tests for locale resolution (pure function) and for `App` rendering each locale.
2. Confirm RED.
3. Write `src/i18n/en.ts`, `pt-BR.ts`, `es.ts`, `locale.ts` (resolution) and `I18nProvider.tsx` (context + `useMessages`).
4. Wire `main.tsx`: resolve from `navigator.languages`, set `document.documentElement.lang`, wrap `App`.
5. Show that a missing key fails `tsc`. This is done by hand during review, because a type test would need a `@ts-expect-error` comment, and comments are not allowed.
6. Update `docs/`.

## Acceptance Criteria
- [ ] `resolveLocale` passes every case in the spec.
- [ ] `App` shows the catalogue text for `en`, `pt-BR` and `es`.
- [ ] Removing a key from `pt-BR.ts` or `es.ts`, or adding one that `en.ts` lacks, makes `npm run typecheck` fail.
- [ ] The running app shows Portuguese on a system set to pt-BR. `<html lang>` matches the active locale.
- [ ] `npm run check` and the affected specs pass.

## Test Strategy
- Pure unit tests (Vitest) for `resolveLocale`, with no DOM.
- Component tests (Vitest + Testing Library) rendering `App` inside `I18nProvider` for each locale.
- Catalogue completeness enforced by `tsc`, and demonstrated once by hand.
- Manual: `npm run tauri dev` on this machine (pt-BR system).

## Dependencies
- Task 04 (frontend scaffold).
- ADR 04 (i18n approach).

## Shared files
- `src/App.tsx`, `src/App.test.tsx`, `src/main.tsx`.
- `docs/desktop-app.md`.
- Sprint `README.md` (roadmap row).

## Spec and ADRs
- Spec: [Spec 05](../specs/spec-05.md)
- ADRs: [ADR 04](../ADRs/adr-04.md), [ADR 05](../ADRs/adr-05.md)

## Progress
- [x] Spec written and reviewed
- [x] Tests written and RED confirmed (`src/i18n/locale.test.ts`, `src/App.test.tsx`)
- [x] GREEN
- [x] Refactor
- [x] Affected specs, lint, typecheck and build passing

## Record
Closed on 2026-10-11.

**Delivered**
- `src/i18n/` with:
  - the `en` (source), `pt-BR` and `es` catalogues;
  - `locale.ts`, which holds `catalogues`, `Locale`, `fallbackLocale` and `resolveLocale`;
  - `I18nProvider.tsx`, with the provider and `useMessages`.
- `App` reads all its text from the catalogue. `main.tsx` resolves the locale from `navigator.languages` and sets `<html lang>`.
- 13 tests: 9 for locale resolution, 3 for `App` in each locale, and 1 for `useMessages` outside the provider.
- `docs/desktop-app.md` has a Translations section: how to add a string or a locale, and the resolution rule.

**Verification**
- RED: both test files failed because the modules did not exist. GREEN: 13 of 13 passed.
- F1 and F2 were demonstrated by hand.
  - With `emptyInbox` removed from `pt-BR.ts`, `tsc` reported `TS2741: Property 'emptyInbox' is missing`.
  - With `extraKey` added to `es.ts`, it reported `TS2353: 'extraKey' does not exist in type 'Messages'`.
  - Both files were restored afterwards.
- `npm run check` passes.

**Differences from the task as written**
- None.

**What the next tasks need to know**
- New UI strings go into `en.ts` first, and `tsc` points to the other catalogues.
- The first string with a count needs `Intl.PluralRules`. No helper exists yet.
- The language override (MVP) will pass a different `locale` to `I18nProvider`. Nothing else changes.
