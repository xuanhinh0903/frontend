import { describe, expect, it } from 'vitest'
import { navLinkClass } from '@/app/layout/utils/navLinkClass'

describe('navLinkClass', () => {
  it('adds the active modifier to the active link', () => {
    expect(navLinkClass({ isActive: true })).toBe(
      'app-nav__link app-nav__link--active',
    )
  })

  it('returns the base class for an inactive link', () => {
    expect(navLinkClass({ isActive: false })).toBe('app-nav__link')
  })
})
