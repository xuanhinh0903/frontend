import { all, call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import { callApi, isApiError } from '@/shared/api'
import {
  login,
  logout,
  readStoredSession,
  refreshTokens,
  removeStoredSession,
  writeStoredSession,
} from '../services'
import {
  loginFailed,
  loginRequested,
  loginSucceeded,
  logoutRequested,
  sessionRestored,
  tokensRefreshed,
} from '../slices'
import type { AuthSession, AuthTokens, StoredSession } from '../types'

function* storeSession(session: StoredSession) {
  try {
    yield call(writeStoredSession, session)
  } catch (error) {
    // Storage is blocked (private mode, quota): the session still works until reload.
    console.error('[auth] Unable to store session', error)
  }
}

function* loginWorker(action: ReturnType<typeof loginRequested>) {
  try {
    const session: AuthSession = yield call(callApi, (signal) =>
      login(action.payload, signal),
    )
    yield call(storeSession, {
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
  const stored: StoredSession | null = yield call(readStoredSession)
  try {
    yield call(removeStoredSession)
  } catch (error) {
    console.error('[auth] Unable to clear stored session', error)
  }
  if (!stored) return
  try {
    yield call(callApi, (signal) => logout(stored.refreshToken, signal))
  } catch {
    // Server-side revocation is best effort; the client session is already gone.
  }
}

// The HTTP client refreshes tokens outside sagas; keep storage in sync with the new refresh token.
function* persistRefreshedTokens(action: ReturnType<typeof tokensRefreshed>) {
  const stored: StoredSession | null = yield call(readStoredSession)
  if (stored)
    yield call(storeSession, {
      ...stored,
      refreshToken: action.payload.refreshToken,
    })
}

export function* restoreSession() {
  const stored: StoredSession | null = yield call(readStoredSession)
  if (!stored) {
    yield put(sessionRestored(null))
    return
  }
  try {
    const tokens: AuthTokens = yield call(callApi, (signal) =>
      refreshTokens(stored.refreshToken, signal),
    )
    yield call(storeSession, {
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
    if (rejected) yield call(removeStoredSession)
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
