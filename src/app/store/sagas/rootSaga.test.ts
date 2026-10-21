import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginRequested, logoutRequested } from '@/features/auth/slices'
import {
  login,
  logout,
  refreshTokens,
  sessionStore,
} from '@/features/auth/services'
import { makeStore } from '@/app/store'

vi.mock('@/features/auth/services', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshTokens: vi.fn(),
  sessionStore: { read: vi.fn(), write: vi.fn(), remove: vi.fn() },
}))

const user = { id: '1', email: 'a@b.c' }
const credentials = { email: 'a@b.c', password: 'secret' }
describe('rootSaga', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(sessionStore.read).mockReturnValue(null)
    vi.mocked(login).mockResolvedValue({
      user,
      accessToken: 'a1',
      refreshToken: 'r1',
    })
    vi.mocked(logout).mockResolvedValue()
  })

  it('restores a stored session with fresh tokens on boot', async () => {
    vi.mocked(sessionStore.read).mockReturnValue({ user, refreshToken: 'r0' })
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
    expect(sessionStore.write).toHaveBeenCalledWith({
      user,
      refreshToken: 'r1',
    })
    expect(store.getState().auth.accessToken).toBe('a1')
    store.dispatch(logoutRequested())
  })

  it('drops a stored session the server rejects', async () => {
    vi.mocked(sessionStore.read).mockReturnValue({ user, refreshToken: 'r0' })
    vi.mocked(refreshTokens).mockRejectedValue({
      status: 401,
      message: 'Invalid token',
    })
    const { store } = makeStore()

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('unauthenticated'),
    )
    expect(sessionStore.remove).toHaveBeenCalled()
  })

  it('keeps a stored session when the server is unreachable', async () => {
    vi.mocked(sessionStore.read).mockReturnValue({ user, refreshToken: 'r0' })
    vi.mocked(refreshTokens).mockRejectedValue({
      status: 'NETWORK',
      message: 'offline',
    })
    const { store } = makeStore()

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('unauthenticated'),
    )
    expect(sessionStore.remove).not.toHaveBeenCalled()
  })

  it('marks anonymous sessions', () => {
    const { store } = makeStore()

    expect(store.getState().auth.status).toBe('unauthenticated')
  })

  it('logs in through the API, then clears the session on logout', async () => {
    const { store } = makeStore()
    store.dispatch(loginRequested(credentials))
    expect(store.getState().auth.status).toBe('loading')

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    expect(login).toHaveBeenCalledWith(credentials, expect.any(AbortSignal))
    expect(sessionStore.write).toHaveBeenCalledWith({
      user,
      refreshToken: 'r1',
    })

    vi.mocked(sessionStore.read).mockReturnValue({ user, refreshToken: 'r1' })
    store.dispatch(logoutRequested())

    expect(sessionStore.remove).toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(logout).toHaveBeenCalledWith('r1', expect.any(AbortSignal)),
    )
    expect(store.getState().auth.accessToken).toBeNull()
  })

  it('still logs in when the session cannot be stored', async () => {
    vi.mocked(sessionStore.write).mockReturnValue(false)
    const { store } = makeStore()
    store.dispatch(loginRequested(credentials))

    await vi.waitFor(() =>
      expect(store.getState().auth.status).toBe('authenticated'),
    )
    store.dispatch(logoutRequested())
  })

  it('reports a failed login with the server message', async () => {
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
  })
})
