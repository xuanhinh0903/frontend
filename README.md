# MSVN

React 19 + TypeScript + Vite SPA for a stock-market product foundation.

## Getting started

This project uses Yarn Classic v1 (version pinned in `package.json`).

```bash
cp .env.example .env.local   # point VITE_API_URL / VITE_WS_URL at your backend
yarn install
yarn dev
yarn test
yarn run check               # ESLint + production build
yarn format:check
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | REST base URL used by `httpClient` and RTK Query |
| `VITE_WS_URL` | _(empty)_ | Realtime WebSocket URL. Empty disables realtime quotes |

There is no mock backend: without a server, login and product pages show their error states.

## Data layer

```
component ──hook──► RTK Query endpoint (features/<name>/services) ─┐
component ──dispatch──► slice ──► Saga ──callApi──► service fn ────┤
                                                                   ▼
                                    shared/api httpClient (fetch, auth, refresh, errors)
```

- **`shared/api/services/httpClient`** orchestrates requests and preserves the public method API. `requestBody` owns serialization, `transport` is the only place that calls `fetch` and composes timeout/cancellation, and `auth` owns access-token and shared-refresh coordination. On a 401 the client refreshes once, retries once, and signs the user out if refresh fails. Every failure rejects with a serializable `ApiError { status, message, code?, details? }`.
- **`shared/api/services/baseApi`** is the one RTK Query slice (`reducerPath: 'api'`). It defines no endpoints; features add them with `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`.
- **`shared/api/sagas/callApi`** runs a service call from a saga and aborts the request when the saga is cancelled.
- **`app/store/api/bindApiClient`** connects the client to the auth slice (token getter, refresh, logout). `shared/api` never imports the store or features.

### RTK Query or Saga?

| Use | For |
| --- | --- |
| RTK Query endpoint | Reading or mutating server data that screens display: caching, loading/error state, invalidation |
| Saga + `callApi` | Multi-step flows and side effects: login, logout, session restore, realtime lifecycle, orchestration across features |

Do not call `fetch` from components or sagas directly.

### Adding an endpoint

```ts
// src/features/order/services/orderApi.ts
export const orderApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Order'] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getOrders: builder.query<Order[], void>({ query: () => '/orders', providesTags: ['Order'] }),
      placeOrder: builder.mutation<Order, NewOrder>({
        query: (body) => ({ url: '/orders', method: 'POST', body }),
        invalidatesTags: ['Order'],
      }),
    }),
  })
```

From a saga: `const order: Order = yield call(callApi, (signal) => httpClient.post('/orders', body, { signal }))`.

## Auth

`POST /auth/login` returns the tokens and user. The access token stays in Redux memory only. `{ user, refreshToken }` is stored under `msvn.auth.session`. On boot, `restoreSession` exchanges the stored refresh token for new tokens. It drops the stored session only when the server rejects it, not when the server is unreachable. Logout clears local state and then revokes the refresh token on the server (best effort).

## Realtime

Login starts `realtimeSaga`, which opens a WebSocket (`VITE_WS_URL?token=<accessToken>`). The client reconnects with exponential backoff and jitter, resubscribes its symbols on every reconnect, and reports `reconnecting` / `connected` to the market slice. Raw frames are validated by `parseRealtimeMessage`; malformed frames are dropped before they reach Redux. Components read quotes with `useQuote(symbol)`.

Do not persist quote ticks, temporary order state, access tokens, or other secrets.

## Backend contract (assumed, not yet confirmed)

| Call | Request | Response |
| --- | --- | --- |
| `POST /auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user: { id, email } }` |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST /auth/logout` | `{ refreshToken }` | `204` |
| `GET /products` | — | `Product[]` |
| `GET /products/:id` | — | `Product` (404 when missing) |
| Error body | — | `{ code?, message?, details? }` |
| WS client → server | `{ action: 'subscribe' \| 'unsubscribe', symbols: string[] }` | |
| WS server → client | | `{ type: 'quote', symbol, price, change, timestamp }` |

Paths live in `features/auth/services/authApi.ts` and `features/product/services/productApi.ts`; WS message types in `features/market/types/realtime.types.ts`.

## Project structure

- `src/app/` — `App`, router, layouts, providers, and the store (`makeStore`, root reducer, persist, root saga, API binding)
- `src/shared/api/` — HTTP client, RTK Query base API, `callApi`, `ApiError`
- `src/features/<name>/` — pages, components, hooks, slices, sagas, services, types, utils per feature
- `src/routes/` — composes public and private routes
