# msvn

React 19 + TypeScript + Vite SPA, using React Router. Path alias `@` maps to `src/`.

## Boot

`src/main.tsx` mounts `App`. `App` wraps `AuthProvider`, then `RouterProvider`. The router is `createBrowserRouter(rootRoutes)` from `src/routes`.

## Directories

- `src/app/` — shell: `App`, the router, `AppLayout`, `PublicLayout`
- `src/routes/` — composes layouts. `public.tsx` and `app.tsx` assemble feature routes
- `src/features/<name>/` — `routes.tsx`, `pages/`, `components/`, `hooks/`, and a barrel `index.ts`
- `src/shared/` — auth, `PATHS` / `ROUTE_SEGMENTS`, `lazyPage`, `resolveSafeRedirect`, `PageShell`, 404 and route-error pages, CSS tokens

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

## Auth

Client-only. `AuthProvider` stores `{ email }` in `localStorage` under `msvn.auth.user`. The login form collects a password but does not check or store it. `RequireAuth` sends anonymous users to `/login` and keeps the current location. After login, `resolveSafeRedirect` accepts only in-app paths that start with `/` and rejects `//`.

## Data

Products are the mock list in `src/features/product/hooks/useProducts.ts`. `useProduct` returns `undefined` when the id does not match; the detail page then shows that the product was not found.

## Adding a feature

1. Add segments and paths in `src/shared/routes/paths.ts` (`ROUTE_SEGMENTS`, `PATHS`).
2. Create `src/features/<name>/` with `routes.tsx` that lazy-loads pages via `lazyPage`, plus `pages/`, `components/`, `hooks/`, and an `index.ts` that exports the routes.
3. Mount those routes in `src/routes/public.tsx` (public) or `src/routes/app.tsx` (wrap with `RequireAuth` when the area is private).

## TSX conventions

Hard rules for every `.tsx` change.

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
