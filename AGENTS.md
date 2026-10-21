# msvn

React 19 + TypeScript + Vite SPA, using React Router. Path alias `@` maps to `src/`.

## Boot

`src/main.tsx` mounts `App`. `App` wraps `AppProviders` (Redux `Provider`), then `RouterProvider`. The router is `createBrowserRouter(rootRoutes)` from `src/routes`.

## Directories

- `src/app/` — shell: `App`, the router, `layout/` (`AppLayout`, `PublicLayout`), `providers/` (`AppProviders` and the app's single store instance in `appStore.ts`), and `store/` (`makeStore()` in `store.ts`, plus `reducers/`, `sagas/`, `api/`, `hooks/`, `types/`). Tests build isolated stores with `makeStore()`
- `src/routes/` — composes layouts. `public.ts` and `app.ts` assemble feature routes
- `src/features/<name>/` — `index.ts`, optional `routes.ts`, and role folders (see Folder and barrel structure)
- `src/shared/` — `api/` (HTTP client, `callApi`, `ApiError`), `storage/` (`StorageItem`: typed, validated, never-throwing localStorage key), `utils/`, `PATHS` / `ROUTE_SEGMENTS`, `lazyPage`, `resolveSafeRedirect`, `PageShell`, 404 and route-error pages, CSS tokens

## Routes

| URL          | Layout         | Guard         | Page               |
| ------------ | -------------- | ------------- | ------------------ |
| `/`          | `AppLayout`    | `RequireAuth` | Home (placeholder) |
| `/login`     | `PublicLayout` | public        | Login              |
| other        | `AppLayout`    | —             | `NotFoundPage`     |
| render error | —              | —             | `RouteErrorPage`   |

Feature pages load through `lazyPage`. `Suspense` sits in the layouts.

## State and auth

Redux Toolkit slices are the single global state source. Redux Saga owns every API call and side effect. RTK Query, redux-persist, Zustand, and Axios are not used.

Auth uses the backend. `loginRequested({ email, password })` sets `status: 'loading'`; the auth Saga calls `POST /auth/login`, stores `{ user, refreshToken }` under `msvn.auth.session`, and emits `loginSucceeded(session)`. The access token lives only in the auth slice. On boot `restoreSession` exchanges the stored refresh token (`POST /auth/refresh`) and emits `sessionRestored`; it removes the stored session only when the server rejects it (4xx). Logout clears state, then revokes the refresh token on the server (best effort). `bindApiClient` (`src/app/store/api`) gives the HTTP client the token getter, the refresh call (dispatches `tokensRefreshed`), and `logoutRequested` on refresh failure. The login page navigates only after `status` becomes `authenticated`. `RequireAuth` sends anonymous users to `/login` and keeps the current location. After login, `resolveSafeRedirect` accepts only in-app paths that start with `/` and rejects `//`.

`src/app/store/sagas/rootSaga.ts` spawns each feature saga under `keepAlive` (restarts a crashed saga at most 5 times), then runs `restoreSession`. `authSaga` lives across sessions; every other feature saga is session-scoped and wrapped in `restartOn(..., logoutRequested.type)`, which cancels its in-flight work on logout. `rootReducer` resets every slice on `logoutRequested`. Redux DevTools are enabled only in development.

## Data

There is no mock backend. Configure `VITE_API_URL` (see `.env.example`); unconfirmed backend contracts are listed in `README.md`.

- `shared/api` `httpClient` is the only `fetch` caller: base URL (absolute URLs pass through), JSON, timeout, bearer token, single shared refresh on 401 with one retry, and every failure as a serializable `ApiError`. `shared/api` never imports the store or features.
- API flow is Redux + Saga only: the UI dispatches a `<thing>Requested` action, the slice sets `status: 'loading'`, the feature Saga runs `yield call(callApi, serviceFn)` (`callApi` passes an `AbortSignal` and aborts when the saga is cancelled, for example by `takeLatest`), then puts `<thing>Succeeded` or `<thing>Failed`. Components read the result through selectors in a feature hook. Never call `fetch` from components or sagas. See `features/auth`.
- Every endpoint URL lives in `API_ENDPOINTS` (`src/shared/api/config/apiEndpoints.ts`), grouped by domain (`API_ENDPOINTS.auth.login`). Never hardcode a URL in a feature.
- Service functions live in `features/<name>/services/` and take `signal` as their last argument.
- Validate raw payloads in feature `utils/` (for example `parseAuthSession`, `parseAuthTokens`) before they reach Redux.
- Keep loading, error, and empty states in the slice and the consuming page.

## Adding a feature

1. Add segments and paths in `src/shared/routes/paths.ts` (`ROUTE_SEGMENTS`, `PATHS`).
2. Create `src/features/<name>/` with `routes.ts` that lazy-loads pages via `lazyPage`, plus the role folders it needs (each with its own `index.ts`) and a root `index.ts` that exports the routes and public API.
3. Mount those routes in `src/routes/public.ts` (public) or `src/routes/app.ts` (nest under the `RequireAuth` route when the area is private).

## Code conventions

Hard rules for every change.

### Folder and barrel structure

- Group files by role into folders: `components/`, `pages/`, `hooks/`, `slices/`, `sagas/`, `selectors/`, `services/` (API/socket clients, storage), `types/`, `utils/`. Create a folder only when it has content.
- Every import uses the `@` alias (`@/features/auth/components`). Relative paths (`./`, `../`) are banned everywhere: `import`, `export … from`, `import()`, `vi.mock`, and CSS `@import`.
- Every folder has an `index.ts`. It is the only entry point from outside the folder. Inside the folder, import a sibling file by its full alias path (`@/features/auth/hooks/useAuth`), never through the folder's own `index.ts` (import cycle). Barrels re-export the same way: `export { useAuth } from '@/features/auth/hooks/useAuth'`.
- Folders inside a shared module (`@/shared/api/types`) are internal to it; outside `src/shared/api`, import `@/shared/api`.
- Lazy pages are the one deep import from outside a folder: `lazyPage(() => import('@/features/<name>/pages/<Page>'), '<Page>')`, so each page gets its own chunk.
- A feature root holds only `index.ts` and `routes.ts`; the root `index.ts` re-exports from its folders.
- Tests sit next to the file they test, in the same folder.
- Do not name a file after its folder (`hooks/typedHooks.ts`, not `hooks/hooks.ts`). Type files are named `*.types.ts`.
- Use `.tsx` only for files that render UI: components, pages, layouts, providers, and the `main.tsx` entry. Everything else is `.ts`, including route config: pass components with `Component` / `ErrorBoundary` (`{ path, Component: LoginPage }`), never `element: <X />`.
- `package.json` declares `"sideEffects": ["*.css"]`, so the bundler treats every TS module as side-effect free. Barrels then do not pull a lazy page's components into the main chunk. Keep modules free of import-time side effects; if one truly needs them, add its path to `sideEffects`.
- `src/app/store` imports feature folders (`@/features/auth/slices`), never a feature root barrel, to avoid import cycles. Features import `@/app/store/hooks`, never `@/app/store`.
- The ESLint rule `local/imports` (`eslint-rules/imports.js`) enforces this: `../components`, `./LoginForm`, `@/features/auth/slices/authSlice` or `@/shared/api/services/httpClient` from another folder, and `@/features/auth/hooks` from inside `hooks/` fail `yarn lint`. `no-restricted-imports` bans `@/app/store` in features.

### Types out of TSX when longer than 5 lines

- Count pure TypeScript type blocks in the file (`type`, `interface`, complex unions and mapped types). Simple props of a few lines may stay inline.
- If total type-declaration lines are greater than 5, move them to a dedicated types file and import them into the TSX.
- Locations:
  - One component or page: co-located `ComponentName.types.ts` (for example `LoginForm.types.ts`)
  - Shared inside a feature: `features/<name>/types/` with an `index.ts` barrel
  - Shared across the app: `shared/types/` with an `index.ts` barrel

### No helper functions in TSX

- Do not put support helpers (format, parse, map, validate, transform, and similar) in `.tsx` files.
- UI event handlers that only wire props or hooks (`handleSubmit`) may stay in the component. Pure logic goes to utils.
- Locations:
  - Feature-only: `features/<name>/utils/` with an `index.ts` barrel
  - Cross-feature: `shared/utils/` with an `index.ts` barrel

Before adding a helper:

1. Search the repo for a similar function.
2. If an existing helper is roughly 70% or more the same purpose or behavior, stop and ask whether to refactor it into a shared util.
3. Add a new helper only after that answer, or when no close match exists.

### Functions in objects and props

Declare a function first, then assign it by name. Never write a function inline as an object property value or a JSX prop, and never use method shorthand in objects.

```ts
// Wrong
return { login: (credentials) => dispatch(loginRequested(credentials)) }
<button onClick={() => remove(id)} />
return { run() { ... } }

// Right
const login = useCallback((credentials: LoginCredentials) => {
  dispatch(loginRequested(credentials))
}, [dispatch])
return { login }

function handleRemove() { remove(id) }
<button onClick={handleRemove} />
```

Every time you declare such a function, decide between `useCallback` and a plain `function`:

- Use `useCallback` when at least one is true:
  1. A shared hook returns it (exported from a barrel or used in several places), so consumers may put it in dependency arrays.
  2. It is passed to a `memo` component or put in a context value.
  3. It is a dependency of `useEffect` / `useMemo` / `useCallback`, or a listener whose identity matters (subscribe/unsubscribe).
- Otherwise use a plain `function handleX() {}`: handlers attached only to native elements (`<button>`, `<input>`, `<form>`) in the same component, or a private hook used by one component. Do not add `useCallback` "just in case"; it costs a dependency comparison and hurts readability.
- Declaring a `function` in a component body still creates a new function every render. It is for readability. Only `useCallback` keeps the identity stable.
- Outside React (services, factories, config objects), declare plain functions and return or assign them by name: `return { connect, disconnect }`.

Allowed inline:

- Callbacks passed as call arguments: `useAppSelector((state) => …)`, `array.map(…)`, `takeEvery(…)`, `useEffect(() => …)`.
- Library config objects: `createSlice` (reducers, prepare), `configureStore`, `createSagaMiddleware`.
- Test files (`*.test.ts(x)`): `vi.mock` factories and fakes.

`no-restricted-syntax` in `eslint.config.js` enforces the inline ban (`yarn lint`). The `useCallback` decision is yours; `react-hooks/exhaustive-deps` checks its dependencies.

## Definition of done

For every change, run `yarn run check`. Add or update focused tests when a test runner exists. Keep reducers pure, keep raw API payloads out of UI components, and report any unimplemented backend contract or performance risk.
