import { describe, expect, it } from 'vitest'
import { readRedirectPath } from '@/features/auth/utils/readRedirectPath'

describe('readRedirectPath', () => {
  it('reads the pathname RequireAuth stored', () => {
    expect(readRedirectPath({ from: { pathname: '/orders' } })).toBe('/orders')
  })

  it.each([
    null,
    undefined,
    'x',
    {},
    { from: null },
    { from: { pathname: 1 } },
  ])('returns undefined for %j', (state) => {
    expect(readRedirectPath(state)).toBeUndefined()
  })
})
