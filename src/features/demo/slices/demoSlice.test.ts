import { describe, expect, it } from 'vitest'
import {
  demoReducer,
  demoUsersFailed,
  demoUsersRequested,
  demoUsersSucceeded,
} from './demoSlice'

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

describe('demoReducer', () => {
  it('starts idle with no users', () => {
    expect(demoReducer(undefined, { type: '@@init' })).toEqual({
      users: [],
      status: 'idle',
      error: null,
    })
  })

  it('tracks a request and stores users on success', () => {
    const loading = demoReducer(undefined, demoUsersRequested())
    expect(loading.status).toBe('loading')

    expect(demoReducer(loading, demoUsersSucceeded([user]))).toEqual({
      users: [user],
      status: 'succeeded',
      error: null,
    })
  })

  it('keeps previous users when a reload fails', () => {
    const loaded = demoReducer(undefined, demoUsersSucceeded([user]))
    const failed = demoReducer(
      demoReducer(loaded, demoUsersRequested()),
      demoUsersFailed('offline'),
    )

    expect(failed).toEqual({
      users: [user],
      status: 'failed',
      error: 'offline',
    })
  })
})
