import { describe, expect, it } from 'vitest'
import { normalizeSymbol } from './normalizeSymbol'

describe('normalizeSymbol', () => {
  it('trims and upper-cases valid symbols', () => {
    expect(normalizeSymbol('  vnm ')).toBe('VNM')
    expect(normalizeSymbol('brk.b')).toBe('BRK.B')
  })

  it('rejects empty, too long, or invalid input', () => {
    expect(normalizeSymbol('   ')).toBeNull()
    expect(normalizeSymbol('ABCDEFGHIJK')).toBeNull()
    expect(normalizeSymbol('VN M')).toBeNull()
    expect(normalizeSymbol('<vnm>')).toBeNull()
  })
})
