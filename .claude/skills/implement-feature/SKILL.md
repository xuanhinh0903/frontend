---
name: implement-feature
description: Steps to implement a feature, fix, or refactor in this repo. Use when asked to build, change, or fix code in src/.
---

# Implement a feature, fix, or refactor

1. **Read the related code first.** Open the files you will change and their callers. For anything touching routes, the store, sagas, auth, or the HTTP client, read `.claude/rules/architecture.md`. For a new feature, use `src/features/auth` as the model.
2. **Find what to reuse.** Search `src/shared/` (`api` with `callApi`, `routes`, `storage`, `utils`, `components`) and `src/app/store/sagas` (`keepAlive`, `restartOn`) before writing a new helper. If an existing helper covers roughly 70% of the need, ask whether to extend it instead of adding a near-duplicate (`.claude/rules/conventions.md`, "No helper functions in TSX").
3. **Make the smallest change that does the job.** Follow `.claude/rules/conventions.md`. Do not reformat or restructure unrelated code, and do not touch dependencies or `yarn.lock` unless the task needs it.
4. **Follow the data flow for API work.** Add the URL to `API_ENDPOINTS`, a service function in `features/<name>/services/` that takes `signal` last, a payload parser in `utils/`, `<thing>Requested` / `Succeeded` / `Failed` actions in the slice, and a saga that uses `callApi`. Wrap a new session-scoped saga with `restartOn(..., logoutRequested.type)` and register it in `src/app/store/sagas/rootSaga.ts`.
5. **Test.** Add or update tests at the layer that owns the behaviour (`.claude/rules/testing.md`): a util, slice or saga gets a unit test next to the file; a component or hook gets a `.test.tsx` with `renderWithProviders` from `@/test`; a saga that reaches the network or storage also gets a `*.integration.test.ts` against the MSW handlers; a new endpoint gets a handler in `src/mocks/handlers/` and a row in the `README.md` contract table. Add an E2E case only when an existing smoke flow cannot cover the change.
6. **Check.** Run `yarn run check` (ESLint, `tsc -b`, Vite build) and `yarn test` (unit, component and integration projects). Both must pass. Run `yarn test:e2e` when you touched routing, auth or anything an `e2e/*.spec.ts` covers.
7. **Report.**
   - what changed and why;
   - the commands you ran and their results;
   - anything not verified;
   - any backend contract that is assumed but not confirmed (add it to `README.md`);
   - any performance risk.
