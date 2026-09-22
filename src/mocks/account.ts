import type { AuthUser, LoginCredentials } from '@/features/auth/types'

// The only account the mock backend accepts. Dependency-free on purpose: Playwright
// specs import this file directly, outside Vite, so it must not touch import.meta.env.
export const MOCK_ACCOUNT: LoginCredentials = {
  email: 'demo@msvn.local',
  password: 'demo1234',
}

export const MOCK_USER: AuthUser = { id: '1', email: MOCK_ACCOUNT.email }
