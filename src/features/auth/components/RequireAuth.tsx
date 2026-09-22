import { Navigate, Outlet, useLocation } from 'react-router'
import { PATHS } from '@/shared/routes'
import { useAuth } from '@/features/auth/hooks'
import type { LoginLocationState } from '@/features/auth/types'

export function RequireAuth() {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'idle') return null

  if (!user) {
    const state: LoginLocationState = { from: location }
    return <Navigate to={PATHS.login} replace state={state} />
  }

  return <Outlet />
}
