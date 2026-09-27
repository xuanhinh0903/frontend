import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  AuthSession,
  AuthState,
  AuthTokens,
  LoginCredentials,
} from '../types'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  error: null,
}

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user
  state.accessToken = session.accessToken
  state.refreshToken = session.refreshToken
  state.status = 'authenticated'
  state.error = null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // The auth saga calls the API; the reducer only tracks the request.
    loginRequested: {
      reducer(state) {
        state.status = 'loading'
        state.error = null
      },
      prepare: (credentials: LoginCredentials) => ({ payload: credentials }),
    },
    loginSucceeded(state, action: PayloadAction<AuthSession>) {
      applySession(state, action.payload)
    },
    loginFailed(state, action: PayloadAction<string>) {
      Object.assign(state, initialState, {
        status: 'unauthenticated',
        error: action.payload,
      })
    },
    tokensRefreshed(state, action: PayloadAction<AuthTokens>) {
      // A refresh that finishes after logout must not revive the session.
      if (!state.user) return
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
    },
    sessionRestored(state, action: PayloadAction<AuthSession | null>) {
      if (action.payload) applySession(state, action.payload)
      else Object.assign(state, initialState, { status: 'unauthenticated' })
    },
    logoutRequested(state) {
      Object.assign(state, initialState, { status: 'unauthenticated' })
    },
  },
})

export const {
  loginRequested,
  loginSucceeded,
  loginFailed,
  tokensRefreshed,
  sessionRestored,
  logoutRequested,
} = authSlice.actions
export const authReducer = authSlice.reducer
