import { call, spawn } from 'redux-saga/effects'
import { authSaga, restoreSession } from '@/features/auth/sagas'
import { keepAlive } from '@/app/store/sagas/sagaUtils'

// Starts each feature saga; feature sagas own their own side effects.
// authSaga runs across sessions (it handles logout itself). Register session-scoped
// feature sagas as `spawn(restartOn(keepAlive(saga), logoutRequested.type))` so
// logout cancels their in-flight work.
export function* rootSaga() {
  yield spawn(keepAlive(authSaga))
  yield call(restoreSession)
}
