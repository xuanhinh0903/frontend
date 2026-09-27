import { describe, expect, it } from 'vitest'
import {
  authReducer,
  loginFailed,
  loginRequested,
  loginSucceeded,
  logoutRequested,
  sessionRestored,
  tokensRefreshed,
} from './authSlice'

const session = {
  user: { id: '1', email: 'a@b.c' },
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
}
const signedOut = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'unauthenticated',
  error: null,
}

describe('authReducer', () => {
  it('starts idle until the session is restored', () => {
    expect(authReducer(undefined, { type: '@@init' }).status).toBe('idle')
  })

  it('tracks a login request and stores the session on success', () => {
    const loading = authReducer(
      undefined,
      loginRequested({ email: 'a@b.c', password: 'x' }),
    )
    expect(loading.status).toBe('loading')

    expect(authReducer(loading, loginSucceeded(session))).toEqual({
      ...session,
      status: 'authenticated',
      error: null,
    })
  })

  it('restores a session or marks it anonymous', () => {
    expect(authReducer(undefined, sessionRestored(session)).status).toBe(
      'authenticated',
    )
    expect(authReducer(undefined, sessionRestored(null))).toEqual(signedOut)
  })

  it('clears tokens on logout and on login failure', () => {
    const loggedIn = authReducer(undefined, loginSucceeded(session))

    expect(authReducer(loggedIn, logoutRequested())).toEqual(signedOut)
    expect(authReducer(loggedIn, loginFailed('nope'))).toEqual({
      ...signedOut,
      error: 'nope',
    })
  })

  it('replaces tokens on refresh, but not after logout', () => {
    const tokens = { accessToken: 'access-2', refreshToken: 'refresh-2' }
    const loggedIn = authReducer(undefined, loginSucceeded(session))

    expect(authReducer(loggedIn, tokensRefreshed(tokens))).toMatchObject(tokens)
    expect(
      authReducer(signedOut as never, tokensRefreshed(tokens)).accessToken,
    ).toBeNull()
  })
})
