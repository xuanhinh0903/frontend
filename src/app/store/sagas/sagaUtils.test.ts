import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runSaga } from 'redux-saga'
import { call } from 'redux-saga/effects'
import { keepAlive } from './sagaUtils'

function run(saga: () => Generator) {
  return runSaga({ dispatch: () => {}, getState: () => ({}) }, saga).toPromise()
}

describe('keepAlive', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs a saga that completes normally once', async () => {
    const saga = vi.fn(function* () {
      yield call(() => {})
    })

    await run(keepAlive(saga))

    expect(saga).toHaveBeenCalledTimes(1)
  })

  it('restarts a crashed saga until it succeeds', async () => {
    let calls = 0
    function* flaky() {
      yield call(() => {
        calls++
        if (calls < 3) throw new Error('boom')
      })
    }

    await run(keepAlive(flaky))

    expect(calls).toBe(3)
  })

  it('gives up after maxRestarts', async () => {
    let calls = 0
    function* broken() {
      yield call(() => {
        calls++
        throw new Error('boom')
      })
    }

    await run(keepAlive(broken, 2))

    expect(calls).toBe(3)
    expect(console.error).toHaveBeenLastCalledWith(
      '[saga] broken gave up after 2 restarts',
      expect.any(Error),
    )
  })
})
