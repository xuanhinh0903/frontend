import type {
  RealtimeClient,
  RealtimeClientMessage,
  RealtimeClientOptions,
  RealtimeEvent,
} from '../types'
import { parseRealtimeMessage, reconnectDelay, socketUrl } from '../utils'

export function createRealtimeClient({
  url,
  getAccessToken,
  maxReconnectDelayMs = 30_000,
}: RealtimeClientOptions): RealtimeClient {
  const listeners = new Set<(event: RealtimeEvent) => void>()
  // Symbols to (re)subscribe whenever a socket opens.
  const symbols = new Set<string>()
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let active = false
  let hasConnected = false

  const emit = (event: RealtimeEvent) =>
    listeners.forEach((listener) => listener(event))

  function send(message: RealtimeClientMessage) {
    if (socket?.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(message))
  }

  function open(onOpen: () => void) {
    // Read the token on every attempt so reconnects use the latest one.
    const ws = new WebSocket(socketUrl(url, getAccessToken()))
    socket = ws

    ws.onopen = () => {
      attempt = 0
      if (symbols.size > 0) send({ action: 'subscribe', symbols: [...symbols] })
      if (hasConnected)
        emit({ type: 'connectionChanged', payload: 'connected' })
      hasConnected = true
      onOpen()
    }
    ws.onmessage = (message) => {
      const event = parseRealtimeMessage(message.data)
      if (event) emit(event)
    }
    // An error is always followed by close, which owns the retry.
    ws.onclose = () => {
      if (socket !== ws || !active) return
      socket = null
      if (hasConnected)
        emit({ type: 'connectionChanged', payload: 'reconnecting' })
      retryTimer = setTimeout(
        () => open(onOpen),
        reconnectDelay(attempt++, maxReconnectDelayMs),
      )
    }
  }

  function connect() {
    active = true
    return new Promise<void>((resolve) => open(resolve))
  }

  function disconnect() {
    active = false
    clearTimeout(retryTimer)
    const ws = socket
    socket = null
    ws?.close()
    symbols.clear()
  }

  function subscribe(symbol: string) {
    if (symbols.has(symbol)) return
    symbols.add(symbol)
    send({ action: 'subscribe', symbols: [symbol] })
  }

  function unsubscribe(symbol: string) {
    if (!symbols.delete(symbol)) return
    send({ action: 'unsubscribe', symbols: [symbol] })
  }

  function onMessage(listener: (event: RealtimeEvent) => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { connect, disconnect, subscribe, unsubscribe, onMessage }
}
