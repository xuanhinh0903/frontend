import type { Quote } from './realtime.types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export type MarketState = {
  connection: ConnectionStatus
  // Ref-count per symbol: how many mounted consumers want its quotes.
  subscriptions: Record<string, number>
  quotes: Record<string, Quote>
}

export type MarketRootState = { market: MarketState }
