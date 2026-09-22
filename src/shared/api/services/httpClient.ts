import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/shared/api/config'
import type {
  ApiClientBindings,
  ApiError,
  HttpClient,
  MethodOptions,
  RequestOptions,
} from '@/shared/api/types'
import {
  buildUrl,
  errorFromResponse,
  parseResponseBody,
  toApiError,
} from '@/shared/api/utils'
import { createAuthManager, type AuthManager } from '@/shared/api/services/auth'
import { serializeRequestBody } from '@/shared/api/services/requestBody'
import { sendRequest } from '@/shared/api/services/transport'

type HttpClientOptions = {
  baseUrl: string
  timeoutMs: number
  auth?: ApiClientBindings
}

const defaultAuth = createAuthManager()

export function configureApiClient(provider: ApiClientBindings | null): void {
  defaultAuth.configure(provider)
}

function createClient({
  baseUrl,
  timeoutMs: defaultTimeoutMs,
  auth,
}: Omit<HttpClientOptions, 'auth'> & { auth: AuthManager }): HttpClient {
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

  // The body is `unknown` on purpose: callers validate it with a parser in their
  // feature's utils/ (see parseAuthSession) instead of trusting a type argument.
  async function request(
    path: string,
    options: RequestOptions = {},
  ): Promise<unknown> {
    try {
      const response = await executeRequest(path, options)
      if (!response.ok) throw await errorFromResponse(response)
      return await parseResponseBody(response)
    } catch (error) {
      throw toApiError(error)
    }
  }

  function get(path: string, options?: MethodOptions) {
    return request(path, { ...options, method: 'GET' })
  }

  function del(path: string, options?: MethodOptions) {
    return request(path, { ...options, method: 'DELETE' })
  }

  function post(path: string, body?: unknown, options?: MethodOptions) {
    return request(path, { ...options, method: 'POST', body })
  }

  function put(path: string, body?: unknown, options?: MethodOptions) {
    return request(path, { ...options, method: 'PUT', body })
  }

  function patch(path: string, body?: unknown, options?: MethodOptions) {
    return request(path, { ...options, method: 'PATCH', body })
  }

  return { request, get, delete: del, post, put, patch }
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
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
