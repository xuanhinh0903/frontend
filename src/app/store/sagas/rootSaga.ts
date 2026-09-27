import { call, put, spawn, takeEvery } from 'redux-saga/effects'
import { baseApi } from '@/shared/api'
import { authSaga, restoreSession } from '@/features/auth/sagas'
import {
  loginSucceeded,
  logoutRequested,
  sessionRestored,
} from '@/features/auth/slices'
import { realtimeSaga } from '@/features/market/sagas'
import { realtimeStarted, realtimeStopped } from '@/features/market/slices'
import { keepAlive } from './sagaUtils'

// Cross-feature orchestration only; each feature saga owns its own side effects.
function* startRealtimeForUser(
  action:
    ReturnType<typeof loginSucceeded> | ReturnType<typeof sessionRestored>,
) {
  if (action.payload) yield put(realtimeStarted())
}

function* clearSession() {
  yield put(realtimeStopped())
  yield put(baseApi.util.resetApiState())
}

function* watchSession() {
  yield takeEvery(
    [loginSucceeded.type, sessionRestored.type],
    startRealtimeForUser,
  )
  yield takeEvery(logoutRequested.type, clearSession)
}

export function* rootSaga() {
  // Spawn watchers first so they see the action restoreSession emits.
  yield spawn(keepAlive(authSaga))
  yield spawn(keepAlive(watchSession))
  yield spawn(keepAlive(realtimeSaga))
  yield call(restoreSession)
}
