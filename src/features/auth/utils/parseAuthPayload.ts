import type { ApiError } from '@/shared/api'
import { isRecord } from '@/shared/utils'
import type { AuthSession, AuthTokens, AuthUser, StoredSession } from '../types'

// Backend contract (unconfirmed): see AUTH_ENDPOINTS in services/authApi.ts.

export function toAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value) || typeof value.email !== 'string') return null
  const id =
    typeof value.id === 'string' || typeof value.id === 'number'
      ? String(value.id)
      : null
  return id ? { id, email: value.email } : null
}

export function toAuthTokens(value: unknown): AuthTokens | null {
  if (!isRecord(value)) return null
  const { accessToken, refreshToken } = value
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string')
    return null
  return { accessToken, refreshToken }
}

export function toStoredSession(value: unknown): StoredSession | null {
  if (!isRecord(value) || typeof value.refreshToken !== 'string') return null
  const user = toAuthUser(value.user)
  return user ? { user, refreshToken: value.refreshToken } : null
}

const invalidPayload: ApiError = {
  status: 'PARSE',
  message: 'Unexpected response from server',
}

export function parseAuthTokens(value: unknown): AuthTokens {
  const tokens = toAuthTokens(value)
  if (!tokens) throw invalidPayload
  return tokens
}

export function parseAuthSession(value: unknown): AuthSession {
  const tokens = toAuthTokens(value)
  const user = isRecord(value) ? toAuthUser(value.user) : null
  if (!tokens || !user) throw invalidPayload
  return { ...tokens, user }
}
