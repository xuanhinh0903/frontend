import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { API_BASE_URL, API_ENDPOINTS, buildUrl } from '@/shared/api'
import { isRecord } from '@/shared/utils'
import { MOCK_ACCOUNT, MOCK_USER } from '@/mocks/account'

// Executable form of the backend contract in README.md ("Backend contract").
// Change the two together.

const REFRESH_PREFIX = 'mock-refresh-'
let issued = 0

// Same handler matches `http://api.test/...` under Vitest and `/api/...` in the browser.
export function apiUrl(path: string): string {
  return buildUrl(API_BASE_URL, path)
}

function issueTokens() {
  issued += 1
  return {
    accessToken: `mock-access-${issued}`,
    refreshToken: `${REFRESH_PREFIX}${issued}`,
  }
}

function unauthorized(code: string, message: string) {
  return HttpResponse.json({ code, message }, { status: 401 })
}

const login: HttpResponseResolver = async ({ request }) => {
  const body: unknown = await request.json()
  if (
    !isRecord(body) ||
    body.email !== MOCK_ACCOUNT.email ||
    body.password !== MOCK_ACCOUNT.password
  ) {
    return unauthorized('INVALID_CREDENTIALS', 'Invalid email or password')
  }
  return HttpResponse.json({ ...issueTokens(), user: MOCK_USER })
}

const refresh: HttpResponseResolver = async ({ request }) => {
  const body: unknown = await request.json()
  const token = isRecord(body) ? body.refreshToken : undefined
  if (typeof token !== 'string' || !token.startsWith(REFRESH_PREFIX)) {
    return unauthorized('INVALID_REFRESH_TOKEN', 'Session expired')
  }
  return HttpResponse.json(issueTokens())
}

const logout: HttpResponseResolver = () => {
  return new HttpResponse(null, { status: 204 })
}

export const authHandlers = [
  http.post(apiUrl(API_ENDPOINTS.auth.login), login),
  http.post(apiUrl(API_ENDPOINTS.auth.refresh), refresh),
  http.post(apiUrl(API_ENDPOINTS.auth.logout), logout),
]
