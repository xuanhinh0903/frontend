import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginSucceeded, logoutRequested } from '@/features/auth/slices'
import { makeStore } from '@/app/store'
import {
  symbolSubscriptionRequested,
  symbolUnsubscriptionRequested,
} from '../slices'
import type { RealtimeEvent } from '../types'

const client = vi.hoisted(() => {
  const listeners = new Set<(event: RealtimeEvent) => void>()
  let resolveConnect: () => void = () => {}
  return {
    listeners,
    connect: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConnect = resolve
        }),
    ),
    finishConnect: () => resolveConnect(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onMessage: (listener: (event: RealtimeEvent) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
})

vi.mock('../services', () => ({ createRealtimeClient: () => client }))

vi.mock('@/features/auth/services', () => ({
  readStoredSession: vi.fn(() => null),
  writeStoredSession: vi.fn(),
  removeStoredSession: vi.fn(),
}))

vi.mock('redux-persist/lib/storage', () => ({
  default: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}))

async function connectedStore() {
  const { store } = makeStore()
  store.dispatch(
    loginSucceeded({
      user: { id: '1', email: 'a@b.c' },
      accessToken: 'a',
      refreshToken: 'r',
    }),
  )
  return store
}

describe('realtimeSaga', () => {
  beforeEach(() => {
    client.subscribe.mockReset()
    client.unsubscribe.mockReset()
    client.listeners.clear()
  })

  it('replays subscriptions requested before the connection is ready', async () => {
    const store = await connectedStore()
    store.dispatch(symbolSubscriptionRequested('VNM'))
    expect(client.subscribe).not.toHaveBeenCalled()

    client.finishConnect()
    await vi.waitFor(() =>
      expect(store.getState().market.connection).toBe('connected'),
    )

    expect(client.subscribe).toHaveBeenCalledTimes(1)
    expect(client.subscribe).toHaveBeenCalledWith('VNM')
    store.dispatch(logoutRequested())
  })

  it('subscribes on the first consumer and unsubscribes after the last one', async () => {
    const store = await connectedStore()
    client.finishConnect()
    await vi.waitFor(() =>
      expect(store.getState().market.connection).toBe('connected'),
    )

    store.dispatch(symbolSubscriptionRequested('VNM'))
    store.dispatch(symbolSubscriptionRequested('VNM'))
    expect(client.subscribe).toHaveBeenCalledTimes(1)

    store.dispatch(symbolUnsubscriptionRequested('VNM'))
    expect(client.unsubscribe).not.toHaveBeenCalled()

    store.dispatch(symbolUnsubscriptionRequested('VNM'))
    expect(client.unsubscribe).toHaveBeenCalledWith('VNM')
    store.dispatch(logoutRequested())
  })

  it('stores quotes emitted by the client', async () => {
    const store = await connectedStore()
    client.finishConnect()
    await vi.waitFor(() =>
      expect(store.getState().market.connection).toBe('connected'),
    )

    const quote = { symbol: 'VNM', price: 78.5, change: 0.5, timestamp: 1 }
    client.listeners.forEach((listener) =>
      listener({ type: 'quoteUpdated', payload: quote }),
    )

    expect(store.getState().market.quotes.VNM).toEqual(quote)
    store.dispatch(logoutRequested())
  })

  it('reports reconnects emitted by the client', async () => {
    const store = await connectedStore()
    client.finishConnect()
    await vi.waitFor(() =>
      expect(store.getState().market.connection).toBe('connected'),
    )

    client.listeners.forEach((listener) =>
      listener({ type: 'connectionChanged', payload: 'reconnecting' }),
    )
    expect(store.getState().market.connection).toBe('reconnecting')

    client.listeners.forEach((listener) =>
      listener({ type: 'connectionChanged', payload: 'connected' }),
    )
    expect(store.getState().market.connection).toBe('connected')
    store.dispatch(logoutRequested())
  })
})
