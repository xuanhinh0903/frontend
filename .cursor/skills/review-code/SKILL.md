---
name: review-code
description: Review priorities and the pre-push gate for this repo. Use when asked to review a change, and before any push.
---

# Review code

Use this for any review request and as the gate before a push.

## What to look for, in priority order

1. **Behavior bugs and correctness.** Wrong logic, unhandled `loading` / error / empty states, races between sagas (`takeLatest` cancellation, a missing `restartOn` on logout), reducers that are not pure, raw API payloads reaching components without a `utils/` parser.
2. **Regressions.** Auth and session flow (`restoreSession`, token refresh on 401, logout reset), `RequireAuth` redirects, `resolveSafeRedirect`, and lazy page chunks (a barrel import that pulls a page's components into the main bundle).
3. **Risk.** Security (tokens, redirects, storage), unconfirmed backend contracts, performance, and missing tests for changed behavior. A test must sit at the layer `.claude/rules/testing.md` assigns: a component change without a `.test.tsx`, a new endpoint without an MSW handler, or a flow change without an integration test is a finding.
4. **Conventions** from `.claude/rules/conventions.md`. Tooling checks the inline-function ban, the `@/` alias (imports, `import()`, `vi.mock`, CSS `@import`), barrel boundaries, layer imports, `.tsx` without JSX, top-level helpers and non-`Props` types in `.tsx`, plus typed lint (floating promises, non-exhaustive `switch`) and strict `tsc` (`noUncheckedIndexedAccess`). Review still owns what tooling cannot see: folder grouping, file naming, helpers hidden inside a component body, and the rules in `.claude/rules/react.md` (effects, derived state, list rendering) and `.claude/rules/ui.md` (tokens only, BEM, number display, a11y floor).

Style that tooling already fixes (Prettier formatting) is not a finding.

## Before push

Nothing reaches the remote until both hold:

1. The change has been reviewed against the list above.
2. `yarn run check` passes (ESLint, TypeScript, Vite build), and `yarn test` passes. Run `yarn test:e2e` as well when routing, auth or a smoke-tested flow changed.

Never push with a failing check, and never skip checks (`--no-verify`).

## Report

List findings with `file:line`, most severe first, each with the concrete failure it causes. Say which checks you ran and their results.
