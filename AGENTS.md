# msvn

React 19 + TypeScript + Vite SPA, using React Router. Path alias `@` maps to `src/`.

## Boot

`src/main.tsx` mounts `App`. `App` wraps `AppProviders` (Redux `Provider` + `PersistGate`), then `RouterProvider`. The router is `createBrowserRouter(rootRoutes)` from `src/routes`.

## Directories

- `src/app/` — shell: `App`, the router, `layout/` (`AppLayout`, `PublicLayout`), `providers/` (`AppProviders` and the app's single store instance in `appStore.ts`), and `store/` (`makeStore()` in `store.ts`, plus `reducers/`, `persist/`, `sagas/`, `hooks/`, `types/`). Tests build isolated stores with `makeStore()`
- `src/routes/` — composes layouts. `public.tsx` and `app.tsx` assemble feature routes
- `src/features/<name>/` — `index.ts`, optional `routes.tsx`, and role folders (see Folder and barrel structure)
- `src/shared/` — `api/` (HTTP client, RTK Query `baseApi`, `callApi`, `ApiError`), `utils/`, `PATHS` / `ROUTE_SEGMENTS`, `lazyPage`, `resolveSafeRedirect`, `PageShell`, 404 and route-error pages, CSS tokens

## Routes

| URL | Layout | Guard | Page |
| --- | --- | --- | --- |
| `/` | `AppLayout` | public | Home |
| `/login` | `PublicLayout` | public | Login |
| `/products` | `AppLayout` | `RequireAuth` | Product list |
| `/products/:id` | `AppLayout` | `RequireAuth` | Product detail |
| other | `AppLayout` | — | `NotFoundPage` |
| render error | — | — | `RouteErrorPage` |

Feature pages load through `lazyPage`. `Suspense` sits in the layouts.

## State and auth

Redux Toolkit is the single global state source. RTK Query owns server cache and request state. Redux Saga owns side effects and realtime lifecycle. Zustand and Axios are not used.

Auth uses the backend. `loginRequested({ email, password })` sets `status: 'loading'`; the auth Saga calls `POST /auth/login`, stores `{ user, refreshToken }` under `msvn.auth.session`, and emits `loginSucceeded(session)`. The access token lives only in the auth slice. On boot `restoreSession` exchanges the stored refresh token (`POST /auth/refresh`) and emits `sessionRestored`; it removes the stored session only when the server rejects it (4xx). Logout clears state, then revokes the refresh token on the server (best effort). `bindApiClient` (`src/app/store/api`) gives the HTTP client the token getter, the refresh call (dispatches `tokensRefreshed`), and `logoutRequested` on refresh failure. redux-persist stores only `userPreferences` and `watchlist`. The login page navigates only after `status` becomes `authenticated`. `RequireAuth` sends anonymous users to `/login` and keeps the current location. After login, `resolveSafeRedirect` accepts only in-app paths that start with `/` and rejects `//`.

`src/app/store/sagas/rootSaga.ts` only orchestrates across features: `loginSucceeded` or `sessionRestored` with a user starts the realtime Saga; `logoutRequested` stops it and resets the RTK Query cache, while the root reducer resets `watchlist` and `market` (`userPreferences` stays). Feature sagas run under `keepAlive`, which restarts a crashed saga at most 5 times. Redux DevTools are enabled only in development. Realtime quote events must be typed and normalized before reaching Redux state. Components read quotes through `useQuote(symbol)` from `@/features/market`; it ref-counts subscriptions per symbol, and the realtime Saga replays them on connect. Do not dispatch `symbolSubscriptionRequested` directly from UI. Do not persist quote ticks or temporary order state.

## Data

There is no mock backend. Configure `VITE_API_URL` and `VITE_WS_URL` (see `.env.example`); unconfirmed backend contracts are listed in `README.md`.

- `shared/api` `httpClient` is the only `fetch` caller: base URL, JSON, timeout, bearer token, single shared refresh on 401 with one retry, and every failure as a serializable `ApiError`. `shared/api` never imports the store or features.
- `baseApi` (`reducerPath: 'api'`) has no endpoints. Features add them in `features/<name>/services/<name>Api.ts` with `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)` (see `features/product/services/productApi.ts`).
- Use RTK Query for server data that screens display (cache, loading/error, invalidation). Use a Saga with `yield call(callApi, (signal) => serviceFn(args, signal))` for multi-step flows and side effects; `callApi` aborts the request when the saga is cancelled. Never call `fetch` from components or sagas.
- Validate raw payloads in feature `utils/` (for example `parseAuthSession`, `parseRealtimeMessage`) before they reach Redux.
- Realtime: `createRealtimeClient` opens `VITE_WS_URL?token=…`, reconnects with backoff, resubscribes on reconnect, and emits `connectionChanged`. An empty `VITE_WS_URL` disables realtime.
- Keep cache policy, endpoint types, loading, error, and empty states at the API boundary and consuming page.

## Adding a feature

1. Add segments and paths in `src/shared/routes/paths.ts` (`ROUTE_SEGMENTS`, `PATHS`).
2. Create `src/features/<name>/` with `routes.tsx` that lazy-loads pages via `lazyPage`, plus the role folders it needs (each with its own `index.ts`) and a root `index.ts` that exports the routes and public API.
3. Mount those routes in `src/routes/public.tsx` (public) or `src/routes/app.tsx` (wrap with `RequireAuth` when the area is private).

## Code conventions

Hard rules for every change.

### Folder and barrel structure

- Group files by role into folders: `components/`, `pages/`, `hooks/`, `slices/`, `sagas/`, `selectors/`, `services/` (API/socket clients, storage), `types/`, `utils/`. Create a folder only when it has content.
- Every folder has an `index.ts`. It is the only entry point from outside the folder. Inside the folder, import siblings with `./file`.
- A feature root holds only `index.ts` and `routes.tsx`; the root `index.ts` re-exports from its folders.
- Tests sit next to the file they test, in the same folder.
- Do not name a file after its folder (`hooks/typedHooks.ts`, not `hooks/hooks.ts`). Type files are named `*.types.ts`.
- `src/app/store` imports feature folders (`@/features/auth/slices`), never a feature root barrel, to avoid import cycles. Features import `@/app/store/hooks`, never `@/app/store`.
- ESLint `no-restricted-imports` in `eslint.config.js` enforces this: deep paths such as `@/features/auth/slices/authSlice`, `@/shared/api/services/httpClient`, `../services/realtimeClient`, or `@/app/store/store` fail `yarn lint`.

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
- Library config objects: `createSlice` (reducers, prepare), `createApi` / `injectEndpoints` / `enhanceEndpoints` (endpoints, query, providesTags), `configureStore`, `createSagaMiddleware`.
- Test files (`*.test.ts(x)`): `vi.mock` factories and fakes.

`no-restricted-syntax` in `eslint.config.js` enforces the inline ban (`yarn lint`). The `useCallback` decision is yours; `react-hooks/exhaustive-deps` checks its dependencies.

## Definition of done

For every change, run `yarn run check`. Add or update focused tests when a test runner exists. Keep reducers pure, keep raw API/socket payloads out of UI components, and report any unimplemented backend contract or performance risk.
