import { describe, expect, it } from 'vitest'
import { logoutRequested } from '@/features/auth/slices'
import { symbolAdded, symbolRemoved, watchlistReducer } from './watchlistSlice'

describe('watchlistReducer', () => {
  it('adds each symbol once and removes it', () => {
    const added = watchlistReducer(undefined, symbolAdded('VNM'))
    const duplicated = watchlistReducer(added, symbolAdded('VNM'))
    const removed = watchlistReducer(duplicated, symbolRemoved('VNM'))

    expect(duplicated.symbols).toEqual(['VNM'])
    expect(removed.symbols).toEqual([])
  })

  it('clears symbols on logout', () => {
    const added = watchlistReducer(undefined, symbolAdded('VNM'))

    expect(watchlistReducer(added, logoutRequested()).symbols).toEqual([])
  })
})