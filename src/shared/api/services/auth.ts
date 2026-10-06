import type { ApiClientBindings } from '../types'
import { createRefreshQueue } from './refreshQueue'

export type AuthManager = {
  configure: (provider: ApiClientBindings | null) => void
  getAccessToken: () => string | null
  getRetryToken: (sentToken: string) => Promise<string>
}

export function createAuthManager(): AuthManager {
  let provider: ApiClientBindings | null = null
  const refreshQueue = createRefreshQueue()

  function configure(next: ApiClientBindings | null) {
    provider = next
  }

  function getAccessToken() {
    return provider?.getAccessToken() ?? null
  }

  function refreshAccessToken(current: ApiClientBindings) {
    return refreshQueue.run(async () => {
      try {
        return await current.refreshAccessToken()
      } catch (error) {
        current.onSessionExpired()
        throw error
      }
    })
  }

  function getRetryToken(sentToken: string): Promise<string> {
    const current = provider
    if (!current) return Promise.reject(new Error('API auth is not configured'))

    const latestToken = current.getAccessToken()
    if (latestToken && latestToken !== sentToken) {
      return Promise.resolve(latestToken)
    }
    return refreshAccessToken(current)
  }

  return { configure, getAccessToken, getRetryToken }
}
