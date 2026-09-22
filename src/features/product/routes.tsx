import { lazyPage, ROUTE_SEGMENTS } from '@/shared'
import type { RouteObject } from 'react-router'

const ProductListPage = lazyPage(
  () => import('./pages/ProductListPage'),
  'ProductListPage',
)

const ProductDetailPage = lazyPage(
  () => import('./pages/ProductDetailPage'),
  'ProductDetailPage',
)

export const productRoutes: RouteObject[] = [
  {
    path: ROUTE_SEGMENTS.products,
    children: [
      { index: true, element: <ProductListPage /> },
      { path: ROUTE_SEGMENTS.productId, element: <ProductDetailPage /> },
    ],
  },
]
