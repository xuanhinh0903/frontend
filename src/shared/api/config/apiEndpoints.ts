// Single source of every API endpoint, grouped by domain.
// Relative paths resolve against API_BASE_URL; absolute URLs pass through as is.
export const API_ENDPOINTS = {
  // Backend contract (unconfirmed):
  //   POST login   { email, password } -> { accessToken, refreshToken, user: { id, email } }
  //   POST refresh { refreshToken }    -> { accessToken, refreshToken }
  //   POST logout  { refreshToken }    -> 204
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
} as const
