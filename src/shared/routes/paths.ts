export const ROUTE_SEGMENTS = {
  login: 'login',
  products: 'products',
  productId: ':id',
} as const

function productDetailPath(id: string) {
  return `/${ROUTE_SEGMENTS.products}/${id}`
}

export const PATHS = {
  home: '/',
  login: `/${ROUTE_SEGMENTS.login}`,
  products: {
    root: `/${ROUTE_SEGMENTS.products}`,
    detail: productDetailPath,
  },
} as const
