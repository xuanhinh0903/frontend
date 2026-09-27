import { Navigate, Outlet, useLocation } from 'react-router'
import { PATHS } from '@/shared/routes'
import { useAuth } from '../hooks'

export function RequireAuth() {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'idle') return null

  if (!user) {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
