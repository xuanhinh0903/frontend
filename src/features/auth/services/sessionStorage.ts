import type { StoredSession } from '../types'
import { toStoredSession } from '../utils'

export const AUTH_STORAGE_KEY = 'msvn.auth.session'

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? toStoredSession(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function writeStoredSession(session: StoredSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function removeStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
