import { httpClient } from '@/shared/api'
import type { AuthSession, AuthTokens, LoginCredentials } from '../types'
import { parseAuthSession, parseAuthTokens } from '../utils'

// Backend contract (unconfirmed):
//   POST login   { email, password } -> { accessToken, refreshToken, user: { id, email } }
//   POST refresh { refreshToken }    -> { accessToken, refreshToken }
//   POST logout  { refreshToken }    -> 204
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
} as const

// Auth endpoints never carry the bearer token and never trigger a refresh.
export async function login(
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<AuthSession> {
  const raw = await httpClient.post<unknown>(
    AUTH_ENDPOINTS.login,
    credentials,
    { auth: false, signal },
  )
  return parseAuthSession(raw)
}

export async function refreshTokens(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<AuthTokens> {
  const raw = await httpClient.post<unknown>(
    AUTH_ENDPOINTS.refresh,
    { refreshToken },
    { auth: false, signal },
  )
  return parseAuthTokens(raw)
}

export async function logout(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<void> {
  await httpClient.post<void>(
    AUTH_ENDPOINTS.logout,
    { refreshToken },
    { auth: false, signal },
  )
}
