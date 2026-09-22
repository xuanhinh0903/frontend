import { lazyPage, ROUTE_SEGMENTS } from '@/shared'
import type { RouteObject } from 'react-router'

const LoginPage = lazyPage(() => import('./pages/LoginPage'), 'LoginPage')

export const loginRoutes: RouteObject[] = [
  { path: ROUTE_SEGMENTS.login, element: <LoginPage /> },
]
