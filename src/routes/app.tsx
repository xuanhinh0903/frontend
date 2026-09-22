import type { RouteObject } from 'react-router'
import { RequireAuth } from '@/shared'
import { homeRoutes } from '@/features/home'
import { productRoutes } from '@/features/product'

export const appAreaRoutes: RouteObject[] = [
  ...homeRoutes,

  {
    element: <RequireAuth />,
    children: productRoutes,
  },
]
