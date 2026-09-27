import { describe, expect, it } from 'vitest'
import { errorFromResponse, isApiErrorStatus, toApiError } from './toApiError'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('toApiError', () => {
  it('reads code, message and details from an error body', async () => {
    await expect(
      errorFromResponse(
        json(
          { code: 'OUT_OF_STOCK', message: 'Sold out', details: { id: 1 } },
          409,
        ),
      ),
    ).resolves.toEqual({
      status: 409,
      code: 'OUT_OF_STOCK',
      message: 'Sold out',
      details: { id: 1 },
    })
  })

  it('falls back to the status when the body is not the error contract', async () => {
    await expect(
      errorFromResponse(new Response('<html>', { status: 502 })),
    ).resolves.toEqual({
      status: 502,
      message: 'Request failed with status 502',
    })
  })

  it('maps client-side failures to string statuses', () => {
    expect(toApiError(new DOMException('t', 'TimeoutError')).status).toBe(
      'TIMEOUT',
    )
    expect(toApiError(new DOMException('a', 'AbortError')).status).toBe(
      'ABORTED',
    )
    expect(toApiError(new SyntaxError('bad json')).status).toBe('PARSE')
    expect(toApiError(new TypeError('fetch failed'))).toEqual({
      status: 'NETWORK',
      message: 'fetch failed',
    })
  })

  it('passes ApiErrors through and matches statuses', () => {
    const error = { status: 404, message: 'Not found' }
    expect(toApiError(error)).toBe(error)
    expect(isApiErrorStatus(error, 404)).toBe(true)
    expect(isApiErrorStatus(undefined, 404)).toBe(false)
  })
})
