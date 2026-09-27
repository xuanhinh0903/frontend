export type Quote = {
  symbol: string
  price: number
  change: number
  timestamp: number
}

// Normalized events the client hands to the saga. Raw socket frames never reach Redux.
export type RealtimeEvent =
  | { type: 'quoteUpdated'; payload: Quote }
  | { type: 'connectionChanged'; payload: 'connected' | 'reconnecting' }

export type RealtimeClient = {
  // Resolves on the first successful open; retries with backoff until then.
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (symbol: string) => void
  unsubscribe: (symbol: string) => void
  onMessage: (listener: (event: RealtimeEvent) => void) => () => void
}

export type RealtimeClientOptions = {
  url: string
  getAccessToken: () => string | null
  maxReconnectDelayMs?: number
}

// Wire contract (unconfirmed with the backend).
// Client -> server:
export type RealtimeClientMessage = {
  action: 'subscribe' | 'unsubscribe'
  symbols: string[]
}
// Server -> client:
export type RealtimeServerMessage = {
  type: 'quote'
  symbol: string
  price: number
  change: number
  timestamp: number
}
