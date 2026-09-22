import type { RouteObject } from 'react-router'
import { AppLayout, PublicLayout } from '@/app/layout'
import { NotFoundPage, RouteErrorPage } from '@/shared'
import { appAreaRoutes } from './app'
import { publicRoutes } from './public'

export const rootRoutes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: publicRoutes,
      },
      {
        element: <AppLayout />,
        children: [...appAreaRoutes, { path: '*', element: <NotFoundPage /> }],
      },
    ],
  },
]
