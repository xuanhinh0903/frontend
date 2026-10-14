import { isRecord } from '@/shared/utils'
import type { ApiError } from '../types'
import { parseResponseBody } from './parseResponseBody'

export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    (typeof value.status === 'number' || typeof value.status === 'string') &&
    typeof value.message === 'string'
  )
}

export function isApiErrorStatus(
  value: unknown,
  status: ApiError['status'],
): boolean {
  return isApiError(value) && value.status === status
}

// Server contract: error bodies are { code?, message?, details? }.
export async function errorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await parseResponseBody(response)
  } catch {
    body = undefined
  }
  const payload = isRecord(body) ? body : {}
  return {
    status: response.status,
    message:
      typeof payload.message === 'string'
        ? payload.message
        : response.statusText ||
          `Request failed with status ${response.status}`,
    ...(typeof payload.code === 'string' && { code: payload.code }),
    ...(payload.details !== undefined && { details: payload.details }),
  }
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  const name =
    isRecord(error) || error instanceof Error
      ? (error as { name?: unknown }).name
      : undefined
  if (name === 'TimeoutError')
    return { status: 'TIMEOUT', message: 'Request timed out' }
  if (name === 'AbortError')
    return { status: 'ABORTED', message: 'Request was cancelled' }
  if (error instanceof SyntaxError)
    return { status: 'PARSE', message: 'Invalid response from server' }
  return {
    status: 'NETWORK',
    message:
      error instanceof Error && error.message
        ? error.message
        : 'Network request failed',
  }
}
