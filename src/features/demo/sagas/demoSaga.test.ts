import { runSaga } from 'redux-saga'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDemoUsers } from '../services'
import { demoUsersFailed, demoUsersSucceeded } from '../slices'
import { fetchDemoUsersWorker } from './demoSaga'

vi.mock('../services', () => ({ fetchDemoUsers: vi.fn() }))

const user = {
  id: 1,
  name: 'A',
  username: 'a',
  email: 'a@b.c',
  phone: '',
  website: '',
  companyName: '',
  city: '',
}

async function runWorker() {
  const dispatched: unknown[] = []
  await runSaga(
    { dispatch: (action) => dispatched.push(action) },
    fetchDemoUsersWorker,
  ).toPromise()
  return dispatched
}

describe('fetchDemoUsersWorker', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls the API with an abort signal and stores the users', async () => {
    vi.mocked(fetchDemoUsers).mockResolvedValue([user])

    expect(await runWorker()).toEqual([demoUsersSucceeded([user])])
    expect(fetchDemoUsers).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('reports ApiError messages and falls back for unknown errors', async () => {
    vi.mocked(fetchDemoUsers).mockRejectedValueOnce({
      status: 'NETWORK',
      message: 'offline',
    })
    expect(await runWorker()).toEqual([demoUsersFailed('offline')])

    vi.mocked(fetchDemoUsers).mockRejectedValueOnce(new Error('boom'))
    expect(await runWorker()).toEqual([demoUsersFailed('Unable to load users')])
  })
})
