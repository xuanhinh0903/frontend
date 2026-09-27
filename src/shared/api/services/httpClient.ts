import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config'
import type { ApiClientBindings, ApiError, RequestOptions } from '../types'
import {
  buildUrl,
  errorFromResponse,
  parseResponseBody,
  toApiError,
} from '../utils'
import { createRefreshQueue } from './refreshQueue'

let bindings: ApiClientBindings | null = null
const refreshQueue = createRefreshQueue()

// Called once by the app layer (makeStore). Pass null to unbind (tests).
export function configureApiClient(next: ApiClientBindings | null) {
  bindings = next
}

export function getAccessToken(): string | null {
  return bindings?.getAccessToken() ?? null
}

function isRawBody(body: unknown): body is BodyInit {
  return (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  )
}

function send(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
) {
  const {
    method = 'GET',
    query,
    body,
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (isRawBody(body)) {
      payload = body
    } else {
      payload = JSON.stringify(body)
      if (!headers.has('Content-Type'))
        headers.set('Content-Type', 'application/json')
    }
  }

  const timeout = AbortSignal.timeout(timeoutMs)
  return fetch(buildUrl(API_BASE_URL, path, query), {
    method,
    headers,
    body: payload,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
}

function renewAccessToken(current: ApiClientBindings): Promise<string> {
  // onSessionExpired runs inside the shared promise, so concurrent 401s trigger it once.
  return refreshQueue.run(async () => {
    try {
      return await current.refreshAccessToken()
    } catch (error) {
      current.onSessionExpired()
      throw error
    }
  })
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const useAuth = options.auth ?? true
  try {
    const sentToken = useAuth ? getAccessToken() : null
    let response = await send(path, options, sentToken)

    // Only authenticated requests are retried: an anonymous 401 is a real error.
    if (response.status === 401 && sentToken && bindings) {
      const latest = bindings.getAccessToken()
      let token: string
      try {
        // Another request may already have refreshed while this one was in flight.
        token =
          latest && latest !== sentToken
            ? latest
            : await renewAccessToken(bindings)
      } catch {
        const expired: ApiError = { status: 401, message: 'Session expired' }
        throw expired
      }
      response = await send(path, options, token)
    }

    if (!response.ok) throw await errorFromResponse(response)
    return (await parseResponseBody(response)) as T
  } catch (error) {
    throw toApiError(error)
  }
}

type MethodOptions = Omit<RequestOptions, 'method' | 'body'>

function get<T>(path: string, options?: MethodOptions) {
  return request<T>(path, { ...options, method: 'GET' })
}

function del<T>(path: string, options?: MethodOptions) {
  return request<T>(path, { ...options, method: 'DELETE' })
}

function post<T>(path: string, body?: unknown, options?: MethodOptions) {
  return request<T>(path, { ...options, method: 'POST', body })
}

function put<T>(path: string, body?: unknown, options?: MethodOptions) {
  return request<T>(path, { ...options, method: 'PUT', body })
}

function patch<T>(path: string, body?: unknown, options?: MethodOptions) {
  return request<T>(path, { ...options, method: 'PATCH', body })
}

// All failures reject with an ApiError (see toApiError).
export const httpClient = { request, get, delete: del, post, put, patch }
