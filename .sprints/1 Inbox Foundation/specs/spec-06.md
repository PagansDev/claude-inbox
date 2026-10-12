# Spec 06 — Review fixes

## Requirement
When the app renders, given any locale, the brand heading must be marked as not translatable, and the page must declare a dark colour scheme. The app must fail loudly when its root element is missing. Test output must show no error stack when a throw is expected.

## Success cases
- **S1:** `App` renders an `<h1>` with `translate="no"`, in every locale.
- **S2:** the `useMessages` outside-provider test passes, and nothing is written to `console.error` during it.
- **S3:** `src/index.css` contains `color-scheme: dark` on `html`. In the running app, native scrollbars render dark.
- **S4:** `README.md` has a Development section that points to `docs/desktop-app.md` and `docs/tooling.md`.

## Failure cases
- **F1:** if `document.getElementById("root")` returns `null`, `main.tsx` throws `Error("Root element #root not found")` instead of rendering nothing.

## Contracts involved
- None. No public API changes.

## Out of scope
- R1 (cargo checks the working tree), R2 (branch protection) and R5 (bundle targets): accepted in REVIEW.md.
