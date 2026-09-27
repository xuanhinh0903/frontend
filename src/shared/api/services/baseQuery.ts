import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { ApiError, ApiRequest } from '../types'
import { toApiError } from '../utils'
import { httpClient } from './httpClient'

// RTK Query adapter over httpClient: same auth, refresh, timeout and error shape.
export const httpBaseQuery: BaseQueryFn<ApiRequest, unknown, ApiError> = async (
  args,
  { signal },
) => {
  const { url, method, params, body } =
    typeof args === 'string' ? { url: args } : args
  try {
    const data = await httpClient.request<unknown>(url, {
      method,
      query: params,
      body,
      signal,
    })
    return { data }
  } catch (error) {
    return { error: toApiError(error) }
  }
}
