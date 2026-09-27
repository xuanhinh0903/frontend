import type { Saga } from 'redux-saga'
import { call } from 'redux-saga/effects'

export function keepAlive(saga: Saga, maxRestarts = 5) {
  return function* keepAliveSaga() {
    for (let restarts = 0; ; restarts++) {
      try {
        yield call(saga)
        return
      } catch (error) {
        if (restarts >= maxRestarts) {
          console.error(`[saga] ${saga.name} gave up after ${maxRestarts} restarts`, error)
          return
        }
        console.error(`[saga] ${saga.name} crashed, restarting`, error)
      }
    }
  }
}
