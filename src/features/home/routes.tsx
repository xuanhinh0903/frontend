import { lazyPage } from '@/shared'
import type { RouteObject } from 'react-router'

const HomePage = lazyPage(() => import('./pages/HomePage'), 'HomePage')

export const homeRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
]
