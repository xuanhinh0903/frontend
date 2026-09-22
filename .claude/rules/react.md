---
description: React 19 rendering and performance rules for components and hooks. Replaces generic React/Next.js skills; only what applies to this Vite SPA.
paths:
  - 'src/**/*.tsx'
  - 'src/**/hooks/**'
---

# React rules

React 19.2, client-only SPA. These rules apply to every component and hook. Where they touch something another rule owns, that rule wins: data loading is Redux Saga + `callApi` (`architecture.md`), function declarations and `useCallback` are in `conventions.md`.

Already handled elsewhere, do not reinvent:

- Code splitting per page: `lazyPage` in `src/shared/routes`. No `React.lazy` in features.
- Data fetching and caching: sagas. No fetching in `useEffect`, no SWR or React Query.
- Barrels: required (`conventions.md`). Generic "avoid barrel imports" advice does not apply here.
- Persisted data: `StorageItem` in `src/shared/storage` with a `parse` function. When the stored shape changes, change the key (`msvn.auth.session.v2`) or make `parse` reject old data.

## State and effects

- Derive what you can during render. Never mirror props or store data into `useState` + `useEffect`.
- Put interaction logic in the event handler that causes it, not in an effect that watches state.
- An effect synchronises with something outside React (DOM API, subscription, timer). It returns a cleanup when it subscribes or schedules.
- Depend on the narrowest primitive values (`user.id`, not `user`). Read a value inside an effect without re-running it through `useEffectEvent`; never list the effect event in the dependency array.
- Use the functional form when the next state depends on the previous one: `setCount((count) => count + 1)`.
- Pass a function to `useState` when the initial value is expensive: `useState(() => buildIndex(rows))`.
- Use `useRef` for values that change without needing a render (timers, previous values, scroll position).
- Global or server state lives in Redux. `useState` is for state local to one component.

## Rendering

- Never define a component inside another component; it remounts on every render. Declare it at module level.
- Do not wrap a cheap expression with a primitive result in `useMemo`. Memoize only measured hot paths and values passed to `memo` children or context.
- A non-primitive default prop of a `memo` component is a module-level constant, not `= []` or `= {}` inline.
- Use an explicit ternary for conditional rendering when the left side can be `0` or `''`: `count > 0 ? <Badge /> : null`, not `count && <Badge />`.
- Large or fast-changing lists (price boards, order books): use `useDeferredValue` or `startTransition` for non-urgent updates, give rows stable `key`s from domain ids, and use `content-visibility: auto` for long off-screen lists. Virtualise only after measuring.
- `Suspense` boundaries sit in the layouts; do not add one per component.

## Plain JavaScript in hot paths

- Prefer `toSorted()`, `toReversed()` and spreads to mutating arrays that came from props or the store.
- Use a `Set` or `Map` for repeated lookups, and build an index map (`Map<id, row>`) once instead of calling `find` inside a loop.
- Hoist `RegExp` literals and other constants out of components and loops.
- Scroll, wheel and touch listeners are `{ passive: true }` unless they call `preventDefault`.
- Return early instead of nesting conditions.
