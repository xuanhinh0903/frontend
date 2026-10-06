import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config'
import type { ApiClientBindings, ApiError, RequestOptions } from '../types'
import {
  buildUrl,
  errorFromResponse,
  parseResponseBody,
  toApiError,
} from '../utils'
import { createAuthManager, type AuthManager } from './auth'
import { serializeRequestBody } from './requestBody'
import { sendRequest } from './transport'

type HttpClientOptions = {
  baseUrl: string
  timeoutMs: number
  auth?: ApiClientBindings
}

type MethodOptions = Omit<RequestOptions, 'method' | 'body'>

const defaultAuth = createAuthManager()

export function configureApiClient(provider: ApiClientBindings | null) {
  defaultAuth.configure(provider)
}

export function getAccessToken(): string | null {
  return defaultAuth.getAccessToken()
}

function createClient({
  baseUrl,
  timeoutMs: defaultTimeoutMs,
  auth,
}: Omit<HttpClientOptions, 'auth'> & { auth: AuthManager }) {
  function send(
    path: string,
    options: RequestOptions,
    accessToken: string | null,
  ) {
    const headers = new Headers(options.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

    return sendRequest(buildUrl(baseUrl, path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: serializeRequestBody(options.body, headers),
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? defaultTimeoutMs,
    })
  }

  async function executeRequest(path: string, options: RequestOptions) {
    const sentToken = options.auth === false ? null : auth.getAccessToken()
    let response = await send(path, options, sentToken)

    if (response.status === 401 && sentToken) {
      let retryToken: string
      try {
        retryToken = await auth.getRetryToken(sentToken)
      } catch {
        const expired: ApiError = { status: 401, message: 'Session expired' }
        throw expired
      }
      response = await send(path, options, retryToken)
    }
    return response
  }

  async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    try {
      const response = await executeRequest(path, options)
      if (!response.ok) throw await errorFromResponse(response)
      return (await parseResponseBody(response)) as T
    } catch (error) {
      throw toApiError(error)
    }
  }

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

  return { request, get, delete: del, post, put, patch }
}

export function createHttpClient(options: HttpClientOptions) {
  const auth = createAuthManager()
  auth.configure(options.auth ?? null)
  return createClient({
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
    auth,
  })
}

export const httpClient = createClient({
  baseUrl: API_BASE_URL,
  timeoutMs: REQUEST_TIMEOUT_MS,
  auth: defaultAuth,
})
