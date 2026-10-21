export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

// Numeric statuses come from the server; string statuses describe client-side failures.
export type ApiErrorStatus =
  number | 'NETWORK' | 'TIMEOUT' | 'ABORTED' | 'PARSE'

// Plain object (not an Error) so it can travel in Redux actions and state.
export type ApiError = {
  status: ApiErrorStatus
  message: string
  code?: string
  details?: unknown
}

export type RequestOptions = {
  method?: HttpMethod
  query?: QueryParams
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  // Attach the bearer token and refresh it on 401. Disable for auth endpoints.
  auth?: boolean
  timeoutMs?: number
}

// Supplied by the app layer so shared/api never imports the store or features.
export type ApiClientBindings = {
  getAccessToken: () => string | null
  // Resolves with a new access token, or rejects when the session cannot be renewed.
  refreshAccessToken: () => Promise<string>
  onSessionExpired: () => void
}
