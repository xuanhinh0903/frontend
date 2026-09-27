import { describe, expect, it } from 'vitest'
import {
  parseAuthSession,
  parseAuthTokens,
  toStoredSession,
} from './parseAuthPayload'

describe('parseAuthPayload', () => {
  it('normalizes a login response and coerces numeric user ids', () => {
    expect(
      parseAuthSession({
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: 7, email: 'a@b.c', role: 'x' },
      }),
    ).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: '7', email: 'a@b.c' },
    })
  })

  it('rejects malformed payloads with a PARSE ApiError', () => {
    expect(() => parseAuthSession({ accessToken: 'a' })).toThrow(
      expect.objectContaining({ status: 'PARSE' }),
    )
    expect(() =>
      parseAuthTokens({ accessToken: 1, refreshToken: 'r' }),
    ).toThrow(expect.objectContaining({ status: 'PARSE' }))
  })

  it('reads only well-formed stored sessions', () => {
    expect(
      toStoredSession({ refreshToken: 'r', user: { id: '1', email: 'a@b.c' } }),
    ).toEqual({
      refreshToken: 'r',
      user: { id: '1', email: 'a@b.c' },
    })
    expect(toStoredSession({ email: 'a@b.c' })).toBeNull()
  })
})
