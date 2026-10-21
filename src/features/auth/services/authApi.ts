import { API_ENDPOINTS, httpClient } from '@/shared/api'
import type {
  AuthSession,
  AuthTokens,
  LoginCredentials,
} from '@/features/auth/types'
import { parseAuthSession, parseAuthTokens } from '@/features/auth/utils'

// Auth endpoints never carry the bearer token and never trigger a refresh.
export async function login(
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<AuthSession> {
  const raw = await httpClient.post<unknown>(
    API_ENDPOINTS.auth.login,
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
    API_ENDPOINTS.auth.refresh,
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
    API_ENDPOINTS.auth.logout,
    { refreshToken },
    { auth: false, signal },
  )
}
