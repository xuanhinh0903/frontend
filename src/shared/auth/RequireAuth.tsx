import { Navigate, Outlet, useLocation } from 'react-router'
import { PATHS } from '../routes'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
