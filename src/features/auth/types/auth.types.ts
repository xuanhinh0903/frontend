export type AuthUser = {
  id: string
  email: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthSession = AuthTokens & { user: AuthUser }

// What survives a reload. The access token stays in memory only.
export type StoredSession = {
  user: AuthUser
  refreshToken: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type AuthStatus =
  'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: AuthStatus
  error: string | null
}

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string | null
  login: (credentials: LoginCredentials) => void
  logout: () => void
}

export type LoginLocationState = {
  from?: {
    pathname: string
  }
}
