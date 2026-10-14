import { lazyPage, ROUTE_SEGMENTS } from '@/shared'
import type { RouteObject } from 'react-router'

const DemoPage = lazyPage(() => import('./pages/DemoPage'), 'DemoPage')

export const demoRoutes: RouteObject[] = [
  { path: ROUTE_SEGMENTS.demo, element: <DemoPage /> },
]
