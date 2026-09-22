import { useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { AUTH_STORAGE_KEY, type AuthUser } from './auth.types'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed?.email !== 'string') return null
    return { email: parsed.email }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  function login(email: string) {
    const nextUser = { email }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
