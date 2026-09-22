---
description: App architecture: boot, directories, routes, state and auth, data flow, adding a feature.
paths:
  - "src/**"
---

# Architecture

React 19 + TypeScript + Vite SPA, using React Router. Path alias `@` maps to `src/`.

## Boot

`src/main.tsx` calls `enableMocking()` first, then dynamically imports `App`. Mocking starts only when `VITE_API_MOCK=true` and the mode is `development` or `e2e`; production builds never include the MSW worker. `App` wraps `AppProviders` (Redux `Provider`), then `RouterProvider`. The router is `createBrowserRouter(rootRoutes)` from `src/routes`.

## Directories

- `src/app/` — shell: `App`, the router, `layout/` (`AppLayout`, `PublicLayout`), `providers/` (`AppProviders` and the app's single store instance in `appStore.ts`), and `store/` (`makeStore()` in `store.ts`, plus `reducers/`, `sagas/`, `api/`, `hooks/`, `types/`). Tests build isolated stores with `makeStore()`
- `src/routes/` — composes layouts. `public.ts` and `app.ts` assemble feature routes
- `src/features/<name>/` — `index.ts`, optional `routes.ts`, and role folders (see "Folder and barrel structure" in `.claude/rules/conventions.md`)
- `src/shared/` — `api/` (HTTP client, `callApi`, `ApiError`), `routes/` (`PATHS`, `ROUTE_SEGMENTS`, `lazyPage`, `resolveSafeRedirect`), `components/` (`PageShell`), `pages/` (home, 404, route-error), `storage/` (`StorageItem`), `utils/`, CSS tokens under `styles/`. Outside those folders, import `@/shared` or the folder barrel (for example `@/shared/api`)
- `src/mocks/` — MSW browser worker, `MOCK_ACCOUNT`, and handlers. Required for mock-mode dev, integration tests, and E2E. Never a separate Node mock server
- `src/test/` — Vitest helpers (`renderWithProviders`, factories, MSW `server`). App code never imports this

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

Two backends, one client path:

- **Real API:** configure `VITE_API_URL` (see `.env.example`). Contracts that are still assumed are listed in `README.md`.
- **MSW mock (required for local/UI automation):** set `VITE_API_MOCK=true`. Handlers in `src/mocks/handlers/` intercept the same `API_ENDPOINTS` URLs in the browser (dev / e2e) and in Node (Vitest `ui` project). Sign in with `MOCK_ACCOUNT` from `src/mocks/account.ts`. Do not add Express/json-server or other stand-alone mock processes.

When you add or change an endpoint, update `API_ENDPOINTS`, the feature service/parser/saga, the MSW handler, and the `README.md` contract row together. The handler is the executable contract for mock-mode work.

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
