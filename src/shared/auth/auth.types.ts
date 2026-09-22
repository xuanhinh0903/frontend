export type AuthUser = {
  email: string
}

export type AuthContextValue = {
  user: AuthUser | null
  login: (email: string) => void
  logout: () => void
}

export type LoginLocationState = {
  from?: {
    pathname: string
  }
}

export const AUTH_STORAGE_KEY = 'msvn.auth.user'
