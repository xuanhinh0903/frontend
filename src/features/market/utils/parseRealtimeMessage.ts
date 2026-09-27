import { isRecord } from '@/shared/utils'
import type { RealtimeEvent } from '../types'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

// Validates a raw socket frame (see RealtimeServerMessage). Unknown or malformed frames return null.
export function parseRealtimeMessage(data: unknown): RealtimeEvent | null {
  if (typeof data !== 'string') return null
  let raw: unknown
  try {
    raw = JSON.parse(data)
  } catch {
    return null
  }
  if (!isRecord(raw) || raw.type !== 'quote') return null

  const { symbol, price, change, timestamp } = raw
  if (typeof symbol !== 'string' || !symbol) return null
  if (
    !isFiniteNumber(price) ||
    !isFiniteNumber(change) ||
    !isFiniteNumber(timestamp)
  )
    return null
  return { type: 'quoteUpdated', payload: { symbol, price, change, timestamp } }
}
