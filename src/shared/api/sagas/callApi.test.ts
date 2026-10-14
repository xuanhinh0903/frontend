import { runSaga, type Saga } from 'redux-saga'
import { call, delay, race } from 'redux-saga/effects'
import { describe, expect, it } from 'vitest'
import { callApi } from './callApi'

function run(saga: Saga) {
  return runSaga({ dispatch: () => {}, getState: () => ({}) }, saga).toPromise()
}

describe('callApi', () => {
  it('returns the API result', async () => {
    let result: unknown
    await run(function* () {
      result = yield call(callApi, async () => 'ok')
    })
    expect(result).toBe('ok')
  })

  it('aborts the request when the saga is cancelled', async () => {
    let received: AbortSignal | undefined
    await run(function* () {
      yield race({
        request: call(callApi, (signal) => {
          received = signal
          return new Promise(() => {})
        }),
        timeout: delay(1),
      })
    })
    expect(received?.aborted).toBe(true)
  })
})
