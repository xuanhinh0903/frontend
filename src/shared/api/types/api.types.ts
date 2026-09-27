export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

// Numeric statuses come from the server; string statuses describe client-side failures.
export type ApiErrorStatus =
  number | 'NETWORK' | 'TIMEOUT' | 'ABORTED' | 'PARSE'

// Plain object (not an Error) so RTK Query can keep it in serializable state.
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

// Argument accepted by RTK Query endpoints: a path, or a full request description.
export type ApiRequest =
  | string
  | { url: string; method?: HttpMethod; params?: QueryParams; body?: unknown }

// Supplied by the app layer so shared/api never imports the store or features.
export type ApiClientBindings = {
  getAccessToken: () => string | null
  // Resolves with a new access token, or rejects when the session cannot be renewed.
  refreshAccessToken: () => Promise<string>
  onSessionExpired: () => void
}
