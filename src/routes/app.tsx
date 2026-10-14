import { Navigate, type RouteObject } from 'react-router'
import { demoRoutes } from '@/features/demo'
import { PATHS } from '@/shared'

// Demo calls a public API, so it does not sit behind RequireAuth.
export const appAreaRoutes: RouteObject[] = [
  { index: true, element: <Navigate to={PATHS.demo} replace /> },
  ...demoRoutes,
]
