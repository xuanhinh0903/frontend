import type {
  AuthSession,
  AuthState,
  AuthUser,
  StoredSession,
} from '@/features/auth/types'

export function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { id: 'user-1', email: 'demo@msvn.local', ...overrides }
}

export function buildSession(
  overrides: Partial<AuthSession> = {},
): AuthSession {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    user: buildUser(),
    ...overrides,
  }
}

export function buildStoredSession(
  overrides: Partial<StoredSession> = {},
): StoredSession {
  return { user: buildUser(), refreshToken: 'refresh-1', ...overrides }
}

// A signed-in auth slice; override `status` / `user` for the other states.
export function buildAuthState(overrides: Partial<AuthState> = {}): AuthState {
  const session = buildSession()
  return {
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    status: 'authenticated',
    error: null,
    ...overrides,
  }
}
