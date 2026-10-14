import type { Dispatch } from '@reduxjs/toolkit'
import { configureApiClient } from '@/shared/api'
import { refreshTokens } from '@/features/auth/services'
import { logoutRequested, tokensRefreshed } from '@/features/auth/slices'
import type { AuthState } from '@/features/auth/types'

type BindableStore = {
  getState: () => { auth: AuthState }
  dispatch: Dispatch
}

// Connects the shared HTTP client to the auth state. The client is a module singleton,
// so the most recently created store wins (one store in the app; tests rebind per store).
export function bindApiClient(store: BindableStore) {
  function getAccessToken() {
    return store.getState().auth.accessToken
  }

  async function refreshAccessToken() {
    const refreshToken = store.getState().auth.refreshToken
    if (!refreshToken) throw new Error('No refresh token')
    const tokens = await refreshTokens(refreshToken)
    store.dispatch(tokensRefreshed(tokens))
    return tokens.accessToken
  }

  function onSessionExpired() {
    store.dispatch(logoutRequested())
  }

  configureApiClient({ getAccessToken, refreshAccessToken, onSessionExpired })
}
