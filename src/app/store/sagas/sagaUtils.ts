import type { Saga, Task } from 'redux-saga'
import type { ActionPattern } from 'redux-saga/effects'
import { call, cancel, fork, take } from 'redux-saga/effects'

export function keepAlive(saga: Saga, maxRestarts = 5) {
  return function* keepAliveSaga() {
    for (let restarts = 0; ; restarts++) {
      try {
        yield call(saga)
        return
      } catch (error) {
        if (restarts >= maxRestarts) {
          console.error(
            `[saga] ${saga.name} gave up after ${maxRestarts} restarts`,
            error,
          )
          return
        }
        console.error(`[saga] ${saga.name} crashed, restarting`, error)
      }
    }
  }
}

// Restarts the saga on every `pattern` action, cancelling its in-flight work first
// (callApi then aborts the request), so a late response cannot reach the reset store.
export function restartOn(saga: Saga, pattern: ActionPattern) {
  return function* restartOnSaga() {
    while (true) {
      const task: Task = yield fork(saga)
      yield take(pattern)
      yield cancel(task)
    }
  }
}
