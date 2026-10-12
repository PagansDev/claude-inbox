# Task 06 — Review fixes

> Activated on 2026-10-12. Added after the code review: the maintainer chose "fix now" for R3, R4, R6 and the two interface findings ([REVIEW.md](../REVIEW.md)).

## Objective
Close the review findings the maintainer chose to fix inside the sprint.

## Context at activation
- Tasks 01–05 are closed.
- REVIEW.md lists R1–R6 plus two interface findings. The maintainer chose to fix R3, R4, R6 and both interface findings. R1, R2 and R5 are accepted and recorded in REVIEW.md.
- The security scan decisions (S1 accepted, S2 and S3 resolved by deleting files) need no code.

## Scope
- In:
  - **R3:** `main.tsx` throws when `#root` is missing.
  - **R4:** the `useMessages` throw test silences React's expected error log.
  - **R6:** the README links to the development docs.
  - **UI:** `color-scheme: dark` on `html`, and `translate="no"` on the brand heading.
- Out: R1, R2 and R5 (accepted).

## Steps
1. Write the test for `translate="no"` on the heading and confirm RED.
2. Apply the UI and R3 changes, and change the R4 test.
3. Add the README development section.
4. Run the affected specs, `npm run check` and the build.

## Acceptance Criteria
- [ ] The heading carries `translate="no"`, and a test proves it.
- [ ] The `useMessages` test passes with no React error stack in the output.
- [ ] `main.tsx` throws `Root element #root not found` when the element is missing.
- [ ] `src/index.css` declares `color-scheme: dark` on `html`.
- [ ] The README has a Development section that links to `docs/desktop-app.md` and `docs/tooling.md`.

## Test Strategy
- Vitest on `src/App.test.tsx`.
- R3 is an entry-point guard with no logic to unit test. It is verified by reading the code, and by the build and the running app.
- `color-scheme` is CSS that jsdom does not apply. It is verified in the running app.

## Dependencies
- Tasks 04 and 05.

## Shared files
- `README.md`.
- `src/App.tsx`, `src/App.test.tsx`, `src/main.tsx`, `src/index.css`.
- `REVIEW.md`, `security-scan.md`, sprint `README.md`.

## Spec and ADRs
- Spec: [Spec 06](../specs/spec-06.md)
- ADRs: [ADR 04](../ADRs/adr-04.md), [ADR 05](../ADRs/adr-05.md)

## Progress
- [x] Spec written and reviewed (scope approved through the review decisions)
- [x] Tests written and RED confirmed
- [x] GREEN
- [x] Refactor
- [x] Affected specs, lint, typecheck and build passing

## Record
Closed on 2026-10-12.

**Delivered**
- `translate="no"` on the brand heading, asserted in all three locale tests.
- `color-scheme: dark` on `html`.
- `main.tsx` throws when `#root` is missing.
- The expected-throw test silences `console.error` and restores it afterwards.
- A Development section in the README.

**Verification**
- RED: the three locale tests failed on the missing `translate` attribute. GREEN: 13 of 13 passed.
- `npm run check` and `npm run build` pass. The test output no longer shows React's error stack.

**Differences from the task as written**
- None.
