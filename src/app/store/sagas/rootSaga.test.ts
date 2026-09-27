import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginRequested, logoutRequested } from '@/features/auth/slices'
import {
  login,
  logout,
  readStoredSession,
  refreshTokens,
  removeStoredSession,
  writeStoredSession,
} from '@/features/auth/services'
import { colorSchemeChanged } from '@/features/preferences/slices'
import { symbolAdded } from '@/features/watchlist/slices'
import { makeStore } from '../store'

vi.mock('@/features/auth/services', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshTokens: vi.fn(),
  readStoredSession: vi.fn(),
  writeStoredSession: vi.fn(),
  removeStoredSession: vi.fn(),
}))

vi.mock('@/features/market/services', () => ({
  createRealtimeClient: () => ({
    connect: () => new Promise<void>(() => {}),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onMessage: () => () => {},
  }),
}))

vi.mock('redux-persist/lib/storage', () => {
  const data = new Map<string, string>()
  return {
    default: {
      getItem: async (key: string) => data.get(key) ?? null,
      setItem: async (key: string, value: string) => void data.set(key, value),
      removeItem: async (key: string) => void data.delete(key),
    },
  }
})

const user = { id: '1', email: 'a@b.c' }
const credentials = { email: 'a@b.c', password: 'secret' }

describe('rootSaga', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(readStoredSession).mockReturnValue(null)
    vi.mocked(login).mockResolvedValue({
      user,
      accessToken: 'a1',
      refreshToken: 'r1',
    })
    vi.mocked(logout).mockResolvedValue()
  })

  it('restores a stored session with fresh tokens and starts realtime on boot', async () => {
    vi.mocked(readStoredSession).mockReturnValue({ user, refreshToken: 'r0' })
    vi.mocked(refreshTokens).mockResolvedValue({
      accessToken: 'a1',
      refreshToken: 'r1',
    })
    const { store } = makeStore()

    expect(store.getState().auth.status).toBe('idle')
    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    expect(refreshTokens).toHaveBeenCalledWith('r0', expect.any(AbortSignal))
    expect(writeStoredSession).toHaveBeenCalledWith({
      user,
      refreshToken: 'r1',
    })
    expect(store.getState().auth.accessToken).toBe('a1')
    expect(store.getState().market.connection).not.toBe('disconnected')
    store.dispatch(logoutRequested())
  })

  it('drops a stored session the server rejects', async () => {
    vi.mocked(readStoredSession).mockReturnValue({ user, refreshToken: 'r0' })
    vi.mocked(refreshTokens).mockRejectedValue({
      status: 401,
      message: 'Invalid token',
    })
    const { store } = makeStore()

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('unauthenticated'),
    )
    expect(removeStoredSession).toHaveBeenCalled()
  })

  it('keeps a stored session when the server is unreachable', async () => {
    vi.mocked(readStoredSession).mockReturnValue({ user, refreshToken: 'r0' })
    vi.mocked(refreshTokens).mockRejectedValue({
      status: 'NETWORK',
      message: 'offline',
    })
    const { store } = makeStore()

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('unauthenticated'),
    )
    expect(removeStoredSession).not.toHaveBeenCalled()
  })

  it('marks anonymous sessions without starting realtime', () => {
    const { store } = makeStore()

    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(store.getState().market.connection).toBe('disconnected')
  })

  it('logs in through the API, then clears user data on logout but keeps preferences', async () => {
    const { store } = makeStore()
    store.dispatch(loginRequested(credentials))
    expect(store.getState().auth.status).toBe('loading')

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    expect(login).toHaveBeenCalledWith(credentials, expect.any(AbortSignal))
    expect(writeStoredSession).toHaveBeenCalledWith({
      user,
      refreshToken: 'r1',
    })
    expect(store.getState().market.connection).not.toBe('disconnected')

    store.dispatch(symbolAdded('VNM'))
    store.dispatch(colorSchemeChanged('dark'))
    vi.mocked(readStoredSession).mockReturnValue({ user, refreshToken: 'r1' })
    store.dispatch(logoutRequested())

    expect(removeStoredSession).toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(logout).toHaveBeenCalledWith('r1', expect.any(AbortSignal)),
    )
    expect(store.getState().auth.accessToken).toBeNull()
    expect(store.getState().watchlist.symbols).toEqual([])
    expect(store.getState().market.connection).toBe('disconnected')
    expect(store.getState().userPreferences.colorScheme).toBe('dark')
  })

  it('still logs in when the session cannot be stored', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(writeStoredSession).mockImplementation(() => {
      throw new Error('storage blocked')
    })
    const { store } = makeStore()
    store.dispatch(loginRequested(credentials))

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    store.dispatch(logoutRequested())
  })

  it('reports a failed login with the server message and does not start realtime', async () => {
    vi.mocked(login).mockRejectedValue({
      status: 401,
      message: 'Wrong email or password',
    })
    const { store } = makeStore()
    store.dispatch(loginRequested(credentials))

    await vi.waitFor(() =>
      expect(store.getState().auth.error).toBe('Wrong email or password'),
    )
    expect(store.getState().auth.user).toBeNull()
    expect(store.getState().market.connection).toBe('disconnected')
  })
})
