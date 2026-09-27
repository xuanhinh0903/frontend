import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RealtimeEvent } from '../types'
import { createRealtimeClient } from './realtimeClient'

class FakeSocket {
  static readonly OPEN = 1
  static instances: FakeSocket[] = []
  readyState = 0
  sent: unknown[] = []
  onopen: (() => void) | null = null
  onmessage: ((message: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  url: string

  constructor(url: string) {
    this.url = url
    FakeSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(JSON.parse(data))
  }
  close = vi.fn(() => this.onclose?.())
  // Test helpers
  open() {
    this.readyState = FakeSocket.OPEN
    this.onopen?.()
  }
  drop() {
    this.readyState = 3
    this.onclose?.()
  }
}

const latest = () => FakeSocket.instances[FakeSocket.instances.length - 1]

describe('createRealtimeClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.instances = []
    vi.stubGlobal('WebSocket', FakeSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function setup() {
    let token = 't1'
    const client = createRealtimeClient({
      url: 'ws://ws.test/stream',
      getAccessToken: () => token,
    })
    const events: RealtimeEvent[] = []
    client.onMessage((event) => events.push(event))
    return { client, events, setToken: (next: string) => (token = next) }
  }

  it('connects with the token and forwards parsed quotes only', async () => {
    const { client, events } = setup()
    const connected = client.connect()
    expect(latest().url).toBe('ws://ws.test/stream?token=t1')
    latest().open()
    await connected

    client.subscribe('VNM')
    latest().onmessage?.({
      data: JSON.stringify({
        type: 'quote',
        symbol: 'VNM',
        price: 1,
        change: 0,
        timestamp: 1,
      }),
    })
    latest().onmessage?.({ data: 'garbage' })

    expect(latest().sent).toEqual([{ action: 'subscribe', symbols: ['VNM'] }])
    expect(events).toEqual([
      {
        type: 'quoteUpdated',
        payload: { symbol: 'VNM', price: 1, change: 0, timestamp: 1 },
      },
    ])
  })

  it('reconnects with backoff, a fresh token, and resubscribes', async () => {
    const { client, events, setToken } = setup()
    const connected = client.connect()
    latest().open()
    await connected
    client.subscribe('VNM')
    client.subscribe('FPT')
    client.unsubscribe('FPT')

    setToken('t2')
    latest().drop()
    expect(events).toEqual([
      { type: 'connectionChanged', payload: 'reconnecting' },
    ])
    expect(FakeSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(1_000)
    expect(FakeSocket.instances).toHaveLength(2)
    expect(latest().url).toBe('ws://ws.test/stream?token=t2')
    latest().open()

    expect(latest().sent).toEqual([{ action: 'subscribe', symbols: ['VNM'] }])
    expect(events.at(-1)).toEqual({
      type: 'connectionChanged',
      payload: 'connected',
    })
  })

  it('keeps retrying until the first connection succeeds', async () => {
    const { client } = setup()
    const connected = client.connect()
    latest().drop()
    vi.advanceTimersByTime(1_000)
    latest().open()
    await expect(connected).resolves.toBeUndefined()
    expect(FakeSocket.instances).toHaveLength(2)
  })

  it('stops reconnecting after disconnect', async () => {
    const { client, events } = setup()
    const connected = client.connect()
    latest().open()
    await connected

    client.disconnect()
    vi.advanceTimersByTime(60_000)

    expect(latest().close).toHaveBeenCalled()
    expect(FakeSocket.instances).toHaveLength(1)
    expect(events).toEqual([])
  })
})
