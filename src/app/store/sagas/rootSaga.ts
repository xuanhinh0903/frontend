import { call, spawn } from 'redux-saga/effects'
import { authSaga, restoreSession } from '@/features/auth/sagas'
import { demoSaga } from '@/features/demo/sagas'
import { keepAlive } from './sagaUtils'

// Starts each feature saga; feature sagas own their own side effects.
export function* rootSaga() {
  yield spawn(keepAlive(authSaga))
  yield spawn(keepAlive(demoSaga))
  yield call(restoreSession)
}
