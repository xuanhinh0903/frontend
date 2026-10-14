# MSVN

React 19 + TypeScript + Vite SPA for a stock-market product foundation.

## Getting started

This project uses Yarn Classic v1 (version pinned in `package.json`).

```bash
cp .env.example .env.local   # point VITE_API_URL at your backend
yarn install
yarn dev
yarn test
yarn run check               # ESLint + production build
yarn format:check
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | REST base URL used by `httpClient` |

There is no mock backend: without a server, login shows its error state. The demo page calls the public `https://jsonplaceholder.typicode.com/users` and works without a backend.

## Data layer

Every API call goes through Redux and Saga:

```
component ─hook─► dispatch(xRequested) ─► slice: status='loading'
                                │
                                ▼
            feature Saga ─callApi─► service fn ─► shared/api httpClient (fetch, auth, refresh, errors)
                                │
                     parse payload (utils/)
                                ▼
            put(xSucceeded | xFailed) ─► slice ─► selectors ─► hook ─► component
```

- **`shared/api/services/httpClient`** orchestrates requests and preserves the public method API. `requestBody` owns serialization, `transport` is the only place that calls `fetch` and composes timeout/cancellation, and `auth` owns access-token and shared-refresh coordination. On a 401 the client refreshes once, retries once, and signs the user out if refresh fails. Every failure rejects with a serializable `ApiError { status, message, code?, details? }`. Absolute URLs bypass `VITE_API_URL`; pass `auth: false` for public or auth endpoints.
- **`shared/api/sagas/callApi`** runs a service call from a saga and aborts the request when the saga is cancelled (`takeLatest`, `race`, logout).
- **`app/store/api/bindApiClient`** connects the client to the auth slice (token getter, refresh, logout). `shared/api` never imports the store or features.

Do not call `fetch` from components or sagas directly.

### Adding an API call

`features/demo` is the reference:

| File | Role |
| --- | --- |
| `services/demoApi.ts` | `fetchDemoUsers(signal)` calls `httpClient.get` and parses the body |
| `utils/parseDemoUsers.ts` | Validates the raw payload into `DemoUser[]` |
| `slices/demoSlice.ts` | `demoUsersRequested` / `demoUsersSucceeded` / `demoUsersFailed`, plus `users`, `status`, `error` |
| `sagas/demoSaga.ts` | `takeLatest(demoUsersRequested, worker)`; worker runs `yield call(callApi, fetchDemoUsers)` |
| `selectors/demoSelectors.ts` | `selectDemoUsers`, `selectDemoStatus`, `selectDemoError` |
| `hooks/useDemoUsers.ts` | Loads once, returns `users`, `isLoading`, `isFailed`, `isEmpty`, `reload` |

Register the reducer in `app/store/reducers/rootReducer.ts` and the saga in `app/store/sagas/rootSaga.ts`.

## Auth

`POST /auth/login` returns the tokens and user. The access token stays in Redux memory only. `{ user, refreshToken }` is stored under `msvn.auth.session`. On boot, `restoreSession` exchanges the stored refresh token for new tokens. It drops the stored session only when the server rejects it, not when the server is unreachable. Logout clears local state and then revokes the refresh token on the server (best effort).

Do not persist access tokens or other secrets.

## Backend contract (assumed, not yet confirmed)

| Call | Request | Response |
| --- | --- | --- |
| `POST /auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user: { id, email } }` |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST /auth/logout` | `{ refreshToken }` | `204` |
| Error body | — | `{ code?, message?, details? }` |

Paths live in `features/auth/services/authApi.ts`.

## Project structure

- `src/app/` — `App`, router, layouts, providers, and the store (`makeStore`, root reducer, root saga, API binding)
- `src/shared/api/` — HTTP client, `callApi`, `ApiError`
- `src/features/<name>/` — pages, components, hooks, slices, sagas, services, types, utils per feature
- `src/routes/` — composes public and private routes
