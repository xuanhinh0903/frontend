export const ROUTE_SEGMENTS = {
  login: 'login',
  products: 'products',
  productId: ':id',
} as const

export const PATHS = {
  home: '/',
  login: `/${ROUTE_SEGMENTS.login}`,
  products: {
    root: `/${ROUTE_SEGMENTS.products}`,
    detail: (id: string) => `/${ROUTE_SEGMENTS.products}/${id}`,
  },
} as const
