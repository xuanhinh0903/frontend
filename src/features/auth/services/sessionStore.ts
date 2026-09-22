import { StorageItem } from '@/shared/storage'
import type { StoredSession } from '@/features/auth/types'
import { toStoredSession } from '@/features/auth/utils'

// What survives a reload: { user, refreshToken }. The access token stays in memory only.
export const sessionStore = new StorageItem<StoredSession>({
  key: 'msvn.auth.session',
  parse: toStoredSession,
})
