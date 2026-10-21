export const ROUTE_SEGMENTS = {
  login: 'login',
} as const

export const PATHS = {
  home: '/',
  login: `/${ROUTE_SEGMENTS.login}`,
} as const
