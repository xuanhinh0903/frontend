export const ROUTE_SEGMENTS = {
  login: 'login',
  demo: 'demo',
} as const

export const PATHS = {
  home: '/',
  login: `/${ROUTE_SEGMENTS.login}`,
  demo: `/${ROUTE_SEGMENTS.demo}`,
} as const
