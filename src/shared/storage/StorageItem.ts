import type { StorageItemOptions } from './storage.types'

function getLocalStorage() {
  return localStorage
}

// A typed, validated, never-throwing handle on one storage key. Storage can be blocked
// (private mode, quota, policy); failures are logged and reported as null / false.
export class StorageItem<T> {
  private readonly key: string
  private readonly parse: (value: unknown) => T | null
  private readonly getStorage: () => Storage

  constructor({
    key,
    parse,
    getStorage = getLocalStorage,
  }: StorageItemOptions<T>) {
    this.key = key
    this.parse = parse
    this.getStorage = getStorage
  }

  read(): T | null {
    let raw: string | null
    try {
      raw = this.getStorage().getItem(this.key)
    } catch (error) {
      this.reportError('read', error)
      return null
    }
    if (raw === null) return null

    let value: T | null = null
    try {
      value = this.parse(JSON.parse(raw))
    } catch {
      // Malformed JSON is handled as an invalid value below.
    }
    // Drop corrupt or outdated data so it is not parsed again on every read.
    if (value === null) this.remove()
    return value
  }

  write(value: T): boolean {
    try {
      this.getStorage().setItem(this.key, JSON.stringify(value))
      return true
    } catch (error) {
      this.reportError('write', error)
      return false
    }
  }

  remove(): boolean {
    try {
      this.getStorage().removeItem(this.key)
      return true
    } catch (error) {
      this.reportError('remove', error)
      return false
    }
  }

  private reportError(operation: string, error: unknown) {
    console.error(`[storage] Unable to ${operation} "${this.key}"`, error)
  }
}
