import { describe, expect, it } from 'vitest'
import { parseRealtimeMessage } from './parseRealtimeMessage'
import { reconnectDelay } from './reconnectDelay'
import { socketUrl } from './socketUrl'

describe('parseRealtimeMessage', () => {
  it('normalizes a quote frame', () => {
    const frame = JSON.stringify({
      type: 'quote',
      symbol: 'VNM',
      price: 78.5,
      change: 0.5,
      timestamp: 1,
      extra: 1,
    })
    expect(parseRealtimeMessage(frame)).toEqual({
      type: 'quoteUpdated',
      payload: { symbol: 'VNM', price: 78.5, change: 0.5, timestamp: 1 },
    })
  })

  it('ignores malformed or unknown frames', () => {
    expect(parseRealtimeMessage('not json')).toBeNull()
    expect(parseRealtimeMessage(new ArrayBuffer(1))).toBeNull()
    expect(parseRealtimeMessage(JSON.stringify({ type: 'trade' }))).toBeNull()
    expect(
      parseRealtimeMessage(
        JSON.stringify({
          type: 'quote',
          symbol: 'VNM',
          price: '78',
          change: 0,
          timestamp: 1,
        }),
      ),
    ).toBeNull()
  })
})

describe('reconnectDelay', () => {
  it('grows exponentially with jitter and caps at the maximum', () => {
    expect(reconnectDelay(0, 30_000, () => 1)).toBe(1_000)
    expect(reconnectDelay(3, 30_000, () => 0)).toBe(4_000)
    expect(reconnectDelay(10, 30_000, () => 1)).toBe(30_000)
  })
})

describe('socketUrl', () => {
  it('adds the access token as a query param', () => {
    expect(socketUrl('ws://ws.test/stream?v=1', 'abc')).toBe(
      'ws://ws.test/stream?v=1&token=abc',
    )
    expect(socketUrl('ws://ws.test/stream', null)).toBe('ws://ws.test/stream')
  })
})
