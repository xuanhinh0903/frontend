import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { loginRequested, logoutRequested } from '../slices'
import type { AuthContextValue, LoginCredentials } from '../types'

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const status = useAppSelector((state) => state.auth.status)
  const error = useAppSelector((state) => state.auth.error)

  // useCallback: shared hook, consumers may pass these to effects or memoized children.
  const login = useCallback(
    (credentials: LoginCredentials) => {
      dispatch(loginRequested(credentials))
    },
    [dispatch],
  )
  const logout = useCallback(() => {
    dispatch(logoutRequested())
  }, [dispatch])

  return { user, status, error, login, logout }
}
