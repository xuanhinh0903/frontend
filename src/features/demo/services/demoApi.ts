import { API_ENDPOINTS, httpClient } from '@/shared/api'
import type { DemoUser } from '../types'
import { parseDemoUsers } from '../utils'

// Public demo API: absolute URL, no bearer token, no refresh.
export async function fetchDemoUsers(
  signal?: AbortSignal,
): Promise<DemoUser[]> {
  const raw = await httpClient.get<unknown>(API_ENDPOINTS.demo.users, {
    auth: false,
    signal,
  })
  return parseDemoUsers(raw)
}
