import type { API_ERROR_KINDS } from '@/shared/api/config'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

// Numeric statuses come from the server; string statuses describe client-side failures.
export type ApiErrorStatus = number | (typeof API_ERROR_KINDS)[number]

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

export type MethodOptions = Omit<RequestOptions, 'method' | 'body'>

// Every method resolves with the raw body as `unknown`: validate it with a parser
// in the feature's utils/ before it reaches Redux.
export type HttpClient = {
  request: (path: string, options?: RequestOptions) => Promise<unknown>
  get: (path: string, options?: MethodOptions) => Promise<unknown>
  delete: (path: string, options?: MethodOptions) => Promise<unknown>
  post: (
    path: string,
    body?: unknown,
    options?: MethodOptions,
  ) => Promise<unknown>
  put: (
    path: string,
    body?: unknown,
    options?: MethodOptions,
  ) => Promise<unknown>
  patch: (
    path: string,
    body?: unknown,
    options?: MethodOptions,
  ) => Promise<unknown>
}

// Supplied by the app layer so shared/api never imports the store or features.
export type ApiClientBindings = {
  getAccessToken: () => string | null
  // Resolves with a new access token, or rejects when the session cannot be renewed.
  refreshAccessToken: () => Promise<string>
  onSessionExpired: () => void
}
