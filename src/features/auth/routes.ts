import { lazyPage, ROUTE_SEGMENTS } from '@/shared'
import type { RouteObject } from 'react-router'

const LoginPage = lazyPage(
  () => import('@/features/auth/pages/LoginPage'),
  'LoginPage',
)

export const authRoutes: RouteObject[] = [
  { path: ROUTE_SEGMENTS.login, Component: LoginPage },
]
