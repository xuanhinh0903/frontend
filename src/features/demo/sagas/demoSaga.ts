import { call, put, takeLatest } from 'redux-saga/effects'
import { callApi, isApiError } from '@/shared/api'
import { fetchDemoUsers } from '../services'
import {
  demoUsersFailed,
  demoUsersRequested,
  demoUsersSucceeded,
} from '../slices'
import type { DemoUser } from '../types'

export function* fetchDemoUsersWorker() {
  try {
    const users: DemoUser[] = yield call(callApi, fetchDemoUsers)
    yield put(demoUsersSucceeded(users))
  } catch (error) {
    yield put(
      demoUsersFailed(
        isApiError(error) ? error.message : 'Unable to load users',
      ),
    )
  }
}

// takeLatest cancels the previous worker; callApi then aborts its request.
export function* demoSaga() {
  yield takeLatest(demoUsersRequested.type, fetchDemoUsersWorker)
}
