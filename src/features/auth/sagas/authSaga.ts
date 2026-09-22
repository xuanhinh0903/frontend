import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import { callApi, isApiError } from '@/shared/api'
import {
  login,
  logout,
  refreshTokens,
  sessionStore,
} from '@/features/auth/services'
import {
  loginFailed,
  loginRequested,
  loginSucceeded,
  logoutRequested,
  sessionRestored,
  tokensRefreshed,
} from '@/features/auth/slices'
import type {
  AuthSession,
  AuthTokens,
  StoredSession,
} from '@/features/auth/types'

function* loginWorker(action: ReturnType<typeof loginRequested>) {
  try {
    const session: AuthSession = yield call(callApi, (signal) =>
      login(action.payload, signal),
    )
    yield call([sessionStore, sessionStore.write], {
      user: session.user,
      refreshToken: session.refreshToken,
    })
    yield put(loginSucceeded(session))
  } catch (error) {
    yield put(
      loginFailed(isApiError(error) ? error.message : 'Unable to sign in'),
    )
  }
}

function* logoutWorker() {
  // The reducer already cleared the tokens; storage still has the refresh token to revoke.
  const stored: StoredSession | null = yield call([
    sessionStore,
    sessionStore.read,
  ])
  yield call([sessionStore, sessionStore.remove])
  if (!stored) return
  try {
    yield call(callApi, (signal) => logout(stored.refreshToken, signal))
  } catch {
    // Server-side revocation is best effort; the client session is already gone.
  }
}

// The HTTP client refreshes tokens outside sagas; keep storage in sync with the new refresh token.
function* persistRefreshedTokens(action: ReturnType<typeof tokensRefreshed>) {
  const stored: StoredSession | null = yield call([
    sessionStore,
    sessionStore.read,
  ])
  if (stored)
    yield call([sessionStore, sessionStore.write], {
      ...stored,
      refreshToken: action.payload.refreshToken,
    })
}

export function* restoreSession() {
  const stored: StoredSession | null = yield call([
    sessionStore,
    sessionStore.read,
  ])
  if (!stored) {
    yield put(sessionRestored(null))
    return
  }
  try {
    const tokens: AuthTokens = yield call(callApi, (signal) =>
      refreshTokens(stored.refreshToken, signal),
    )
    yield call([sessionStore, sessionStore.write], {
      user: stored.user,
      refreshToken: tokens.refreshToken,
    })
    yield put(sessionRestored({ ...tokens, user: stored.user }))
  } catch (error) {
    // Drop the stored session only when the server rejected it, not when it was unreachable.
    const rejected =
      isApiError(error) &&
      typeof error.status === 'number' &&
      error.status < 500
    if (rejected) yield call([sessionStore, sessionStore.remove])
    yield put(sessionRestored(null))
  }
}

export function* authSaga() {
  yield all([
    takeLatest(loginRequested.type, loginWorker),
    takeLatest(logoutRequested.type, logoutWorker),
    takeEvery(tokensRefreshed.type, persistRefreshedTokens),
  ])
}
