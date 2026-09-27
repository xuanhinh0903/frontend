import type { SagaIterator } from 'redux-saga'
import { call, cancelled } from 'redux-saga/effects'

// Runs an API call inside a saga and aborts the request if the saga is cancelled
// (takeLatest, race, logout...). Usage:
//   const user: User = yield call(callApi, (signal) => fetchUser(id, signal))
export function* callApi<T>(
  fn: (signal: AbortSignal) => Promise<T>,
): SagaIterator<T> {
  const controller = new AbortController()
  try {
    const result: T = yield call(fn, controller.signal)
    return result
  } finally {
    if (yield cancelled()) controller.abort()
  }
}
