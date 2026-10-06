import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiClientBindings } from '../types'
import { httpBaseQuery } from './baseQuery'
import { configureApiClient, createHttpClient, httpClient } from './httpClient'

const fetchMock = vi.fn<typeof fetch>()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function sentRequest(call = 0) {
  const [url, init] = fetchMock.mock.calls[call]
  return { url, init: init!, headers: new Headers(init!.headers) }
}

function bindTokens(overrides: Partial<ApiClientBindings> = {}) {
  let token = 'old'
  const bindings: ApiClientBindings = {
    getAccessToken: () => token,
    refreshAccessToken: vi.fn(async () => {
      token = 'new'
      return token
    }),
    onSessionExpired: vi.fn(),
    ...overrides,
  }
  configureApiClient(bindings)
  return bindings
}

describe('httpClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    configureApiClient(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends JSON to the configured base URL and parses JSON responses', async () => {
    fetchMock.mockResolvedValue(json({ id: '1' }, 201))

    await expect(
      httpClient.post('/products', { name: 'A' }, { query: { draft: true } }),
    ).resolves.toEqual({
      id: '1',
    })
    const { url, init, headers } = sentRequest()
    expect(url).toBe('http://api.test/products?draft=true')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"name":"A"}')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(httpClient.delete('/products/1')).resolves.toBeUndefined()
  })

  it('supports every method helper, query parameters and custom headers', async () => {
    fetchMock.mockImplementation(async () => json({ ok: true }))

    await httpClient.get('/products', {
      query: { page: 2 },
      headers: { 'X-Request-Id': 'request-1' },
    })
    await httpClient.put('/products/1', { name: 'B' })
    await httpClient.patch('/products/1', { name: 'C' })
    await httpClient.delete('/products/1')

    expect(sentRequest(0).url).toBe('http://api.test/products?page=2')
    expect(sentRequest(0).headers.get('X-Request-Id')).toBe('request-1')
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      'GET',
      'PUT',
      'PATCH',
      'DELETE',
    ])
  })

  it.each([
    ['string', 'plain text'],
    ['FormData', new FormData()],
    ['Blob', new Blob(['blob'])],
    ['URLSearchParams', new URLSearchParams({ q: 'value' })],
    ['ArrayBuffer', new ArrayBuffer(4)],
  ])(
    'passes a %s body through without JSON serialization',
    async (_name, body) => {
      fetchMock.mockResolvedValue(json({ ok: true }))

      await httpClient.post('/upload', body)

      expect(sentRequest().init.body).toBe(body)
      expect(sentRequest().headers.has('Content-Type')).toBe(false)
    },
  )

  it('preserves a manually provided Content-Type for JSON-compatible bodies', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }))

    await httpClient.post(
      '/products',
      { name: 'A' },
      { headers: { 'Content-Type': 'application/vnd.api+json' } },
    )

    expect(sentRequest().init.body).toBe('{"name":"A"}')
    expect(sentRequest().headers.get('Content-Type')).toBe(
      'application/vnd.api+json',
    )
  })

  it('attaches the bearer token unless auth is disabled', async () => {
    bindTokens()
    fetchMock.mockImplementation(async () => json({}))

    await httpClient.get('/me')
    await httpClient.post('/auth/login', {}, { auth: false })

    expect(sentRequest(0).headers.get('Authorization')).toBe('Bearer old')
    expect(sentRequest(1).headers.has('Authorization')).toBe(false)
  })

  it('creates an isolated client with explicit configuration', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }))
    const client = createHttpClient({
      baseUrl: 'https://isolated.test/api',
      timeoutMs: 1_000,
      auth: {
        getAccessToken: () => 'isolated',
        refreshAccessToken: async () => 'refreshed',
        onSessionExpired: vi.fn(),
      },
    })

    await client.get('/status')

    expect(sentRequest().url).toBe('https://isolated.test/api/status')
    expect(sentRequest().headers.get('Authorization')).toBe('Bearer isolated')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    const bindings = bindTokens()
    fetchMock.mockImplementation(async (_url, init) =>
      new Headers(init?.headers).get('Authorization') === 'Bearer new'
        ? json({ ok: true })
        : json({}, 401),
    )

    const results = await Promise.all([
      httpClient.get('/a'),
      httpClient.get('/b'),
    ])

    expect(results).toEqual([{ ok: true }, { ok: true }])
    expect(bindings.refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('expires the session once when the refresh fails', async () => {
    const bindings = bindTokens({
      refreshAccessToken: vi.fn(async () => Promise.reject(new Error('nope'))),
    })
    fetchMock.mockImplementation(async () => json({}, 401))

    const results = await Promise.allSettled([
      httpClient.get('/a'),
      httpClient.get('/b'),
    ])

    expect(results.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
    ])
    expect(results[0]).toMatchObject({
      reason: { status: 401, message: 'Session expired' },
    })
    expect(bindings.onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('retries an authenticated request at most once', async () => {
    const bindings = bindTokens()
    fetchMock.mockResolvedValue(json({ message: 'Still unauthorized' }, 401))

    await expect(httpClient.get('/me')).rejects.toEqual({
      status: 401,
      message: 'Still unauthorized',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bindings.refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('does not refresh anonymous requests', async () => {
    const bindings = bindTokens({ getAccessToken: () => null })
    fetchMock.mockResolvedValue(json({ message: 'Login required' }, 401))

    await expect(httpClient.get('/me')).rejects.toEqual({
      status: 401,
      message: 'Login required',
    })
    expect(bindings.refreshAccessToken).not.toHaveBeenCalled()
  })

  it('rejects with NETWORK, TIMEOUT and ABORTED errors', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(httpClient.get('/a')).rejects.toMatchObject({
      status: 'NETWORK',
    })

    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason),
          ),
        ),
    )
    await expect(
      httpClient.get('/slow', { timeoutMs: 5 }),
    ).rejects.toMatchObject({ status: 'TIMEOUT' })

    const controller = new AbortController()
    const pending = httpClient.get('/slow', { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ status: 'ABORTED' })
  })
})

describe('httpBaseQuery', () => {
  const api = { signal: new AbortController().signal } as Parameters<
    typeof httpBaseQuery
  >[1]

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns data for string and object arguments', async () => {
    fetchMock.mockImplementation(async () => json([1]))

    await expect(httpBaseQuery('/products', api, {})).resolves.toEqual({
      data: [1],
    })
    await expect(
      httpBaseQuery(
        {
          url: '/products',
          method: 'PATCH',
          params: { page: 2 },
          body: { a: 1 },
        },
        api,
        {},
      ),
    ).resolves.toEqual({ data: [1] })
    expect(sentRequest(1).url).toBe('http://api.test/products?page=2')
    expect(sentRequest(1).init.method).toBe('PATCH')
  })

  it('returns ApiErrors instead of throwing', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Not found' }, 404))
    await expect(httpBaseQuery('/products/9', api, {})).resolves.toEqual({
      error: { status: 404, message: 'Not found' },
    })
  })
})
