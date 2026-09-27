import { describe, expect, it } from 'vitest'
import { formatChange, formatPrice } from './formatNumber'

describe('formatNumber', () => {
  it('formats prices with two decimals', () => {
    expect(formatPrice(78)).toBe('78.00')
    expect(formatPrice(1234.567)).toBe('1,234.57')
  })

  it('signs non-zero changes', () => {
    expect(formatChange(0.5)).toBe('+0.50')
    expect(formatChange(-0.5)).toBe('-0.50')
    expect(formatChange(0)).toBe('0.00')
  })
})
