import { describe, expect, it } from 'vitest'
import { logoutRequested } from '@/features/auth/slices'
import {
  connectionChanged,
  marketReducer,
  quoteUpdated,
  realtimeStarted,
  realtimeStopped,
  symbolSubscriptionRequested,
  symbolUnsubscriptionRequested,
} from './marketSlice'

describe('marketReducer', () => {
  it('stores the latest quote by symbol', () => {
    const state = marketReducer(
      undefined,
      quoteUpdated({ symbol: 'VNM', price: 78.25, change: 0.25, timestamp: 1 }),
    )

    expect(state.quotes.VNM.price).toBe(78.25)
    expect(state.quotes.VNM.timestamp).toBe(1)
  })

  it('ignores a duplicate start while already connected', () => {
    const connected = marketReducer(undefined, connectionChanged('connected'))

    expect(marketReducer(connected, realtimeStarted()).connection).toBe('connected')
  })

  it('ref-counts subscriptions per symbol', () => {
    let state = marketReducer(undefined, symbolSubscriptionRequested('VNM'))
    state = marketReducer(state, symbolSubscriptionRequested('VNM'))
    state = marketReducer(state, symbolUnsubscriptionRequested('VNM'))
    expect(state.subscriptions).toEqual({ VNM: 1 })

    state = marketReducer(state, symbolUnsubscriptionRequested('VNM'))
    expect(state.subscriptions).toEqual({})
  })

  it('ignores unsubscribing an unknown symbol', () => {
    const state = marketReducer(undefined, symbolUnsubscriptionRequested('VNM'))

    expect(state.subscriptions).toEqual({})
  })

  it('keeps subscriptions when realtime stops', () => {
    const subscribed = marketReducer(undefined, symbolSubscriptionRequested('VNM'))

    expect(marketReducer(subscribed, realtimeStopped()).subscriptions).toEqual({ VNM: 1 })
  })

  it('returns to the initial state on logout', () => {
    const subscribed = marketReducer(undefined, symbolSubscriptionRequested('VNM'))
    const quoted = marketReducer(
      subscribed,
      quoteUpdated({ symbol: 'VNM', price: 78.25, change: 0.25, timestamp: 1 }),
    )

    expect(marketReducer(quoted, logoutRequested())).toEqual({
      connection: 'disconnected',
      subscriptions: {},
      quotes: {},
    })
  })
})
