import { describe, expect, it } from 'vitest'
import { buildUrl } from './buildUrl'

describe('buildUrl', () => {
  it('joins base and path with exactly one slash', () => {
    expect(buildUrl('http://api.test/', '/products')).toBe(
      'http://api.test/products',
    )
    expect(buildUrl('/api', 'products')).toBe('/api/products')
  })

  it('keeps absolute URLs as they are', () => {
    expect(buildUrl('/api', 'https://cdn.test/file.json')).toBe(
      'https://cdn.test/file.json',
    )
  })

  it('appends defined query params only', () => {
    expect(
      buildUrl('/api', '/products', {
        page: 2,
        q: 'a b',
        empty: undefined,
        none: null,
      }),
    ).toBe('/api/products?page=2&q=a+b')
    expect(buildUrl('/api', '/products?sort=name', { page: 1 })).toBe(
      '/api/products?sort=name&page=1',
    )
  })
})
