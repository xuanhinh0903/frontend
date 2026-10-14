import { StorageItem } from '@/shared/storage'
import type { StoredSession } from '../types'
import { toStoredSession } from '../utils'

// What survives a reload: { user, refreshToken }. The access token stays in memory only.
export const sessionStore = new StorageItem<StoredSession>({
  key: 'msvn.auth.session',
  parse: toStoredSession,
})
