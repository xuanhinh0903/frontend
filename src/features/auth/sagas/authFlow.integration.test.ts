import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { API_ENDPOINTS } from '@/shared/api'
import { loginRequested, logoutRequested } from '@/features/auth/slices'
import { makeStore } from '@/app/store'
import { MOCK_ACCOUNT, MOCK_USER } from '@/mocks'
import { apiUrl } from '@/mocks/handlers'
import { buildStoredSession, server } from '@/test'

// Real store, real sagas, real HTTP client; only the network is mocked (MSW).
// Request details (headers, retry, timeout) are covered by httpClient.test.ts.

const SESSION_KEY = 'msvn.auth.session'

function readStoredSession(): unknown {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

function seedStoredSession(refreshToken: string) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(buildStoredSession({ user: MOCK_USER, refreshToken })),
  )
}

async function bootStore() {
  const { store } = makeStore()
  await vi.waitFor(() => expect(store.getState().auth.status).not.toBe('idle'))
  return store
}

describe('auth flow (store + sagas + MSW)', () => {
  it('signs in and persists the user with the refresh token', async () => {
    const store = await bootStore()
    expect(store.getState().auth.status).toBe('unauthenticated')

    store.dispatch(loginRequested(MOCK_ACCOUNT))

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    const { auth } = store.getState()
    expect(auth.user).toEqual(MOCK_USER)
    expect(auth.accessToken).toMatch(/^mock-access-/)
    expect(readStoredSession()).toEqual({
      user: MOCK_USER,
      refreshToken: auth.refreshToken,
    })
  })

  it('shows the server message when credentials are rejected', async () => {
    const store = await bootStore()

    store.dispatch(loginRequested({ ...MOCK_ACCOUNT, password: 'wrong' }))

    await vi.waitFor(() =>
      expect(store.getState().auth.error).toBe('Invalid email or password'),
    )
    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(readStoredSession()).toBeNull()
  })

  it('restores a stored session on boot and rotates the refresh token', async () => {
    seedStoredSession('mock-refresh-boot')

    const store = await bootStore()

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    expect(store.getState().auth.user).toEqual(MOCK_USER)
    expect(readStoredSession()).toEqual({
      user: MOCK_USER,
      // Asymmetric matchers are typed `any`; `unknown` keeps typed lint quiet.
      refreshToken: expect.not.stringMatching(/^mock-refresh-boot$/) as unknown,
    })
  })

  it('drops a stored session the server rejects', async () => {
    seedStoredSession('stale')

    const store = await bootStore()

    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(readStoredSession()).toBeNull()
  })

  it('keeps a stored session when the server is unreachable', async () => {
    seedStoredSession('mock-refresh-offline')
    server.use(
      http.post(apiUrl(API_ENDPOINTS.auth.refresh), () => HttpResponse.error()),
    )

    const store = await bootStore()

    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(readStoredSession()).toEqual({
      user: MOCK_USER,
      refreshToken: 'mock-refresh-offline',
    })
  })

  it('logs out locally first, then revokes the refresh token', async () => {
    const revoked: unknown[] = []
    server.use(
      http.post(apiUrl(API_ENDPOINTS.auth.logout), async ({ request }) => {
        revoked.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const store = await bootStore()
    store.dispatch(loginRequested(MOCK_ACCOUNT))
    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    const { refreshToken } = store.getState().auth

    store.dispatch(logoutRequested())

    expect(store.getState().auth.user).toBeNull()
    await vi.waitFor(() => expect(revoked).toEqual([{ refreshToken }]))
    expect(readStoredSession()).toBeNull()
  })
})
