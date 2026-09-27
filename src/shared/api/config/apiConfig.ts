export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Empty means realtime is disabled (no backend configured).
export const WS_URL = import.meta.env.VITE_WS_URL ?? ''

export const REQUEST_TIMEOUT_MS = 15_000
