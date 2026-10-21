import type { RouteObject } from 'react-router'
import { AppLayout, PublicLayout } from '@/app/layout'
import { NotFoundPage, RouteErrorPage } from '@/shared'
import { appAreaRoutes } from '@/routes/app'
import { publicRoutes } from '@/routes/public'

export const rootRoutes: RouteObject[] = [
  {
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: PublicLayout,
        children: publicRoutes,
      },
      {
        Component: AppLayout,
        children: [...appAreaRoutes, { path: '*', Component: NotFoundPage }],
      },
    ],
  },
]
