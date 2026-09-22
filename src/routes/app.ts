import type { RouteObject } from 'react-router'
import { RequireAuth } from '@/features/auth'
import { HomePage } from '@/shared'

// The app area requires a session; anonymous users go to /login.
export const appAreaRoutes: RouteObject[] = [
  {
    Component: RequireAuth,
    children: [{ index: true, Component: HomePage }],
  },
]
