import { afterEach, describe, expect, it, vi } from 'vitest'
import { isRecord } from '@/shared/utils'
import { StorageItem } from '@/shared/storage/StorageItem'

type Item = { name: string }

function parseItem(value: unknown): Item | null {
  return isRecord(value) && typeof value.name === 'string'
    ? { name: value.name }
    : null
}

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

function createBlockedStorage(): Storage {
  const storage = createMemoryStorage()
  const blocked = () => {
    throw new DOMException('blocked', 'SecurityError')
  }
  return { ...storage, getItem: blocked, setItem: blocked, removeItem: blocked }
}

describe('StorageItem', () => {
  afterEach(() => vi.restoreAllMocks())

  it('writes, reads and removes a value', () => {
    const storage = createMemoryStorage()
    const item = new StorageItem({
      key: 'k',
      parse: parseItem,
      getStorage: () => storage,
    })

    expect(item.read()).toBeNull()
    expect(item.write({ name: 'a' })).toBe(true)
    expect(item.read()).toEqual({ name: 'a' })
    expect(item.remove()).toBe(true)
    expect(item.read()).toBeNull()
  })

  it('drops malformed JSON and values the parser rejects', () => {
    const storage = createMemoryStorage()
    const item = new StorageItem({
      key: 'k',
      parse: parseItem,
      getStorage: () => storage,
    })

    storage.setItem('k', '{not json')
    expect(item.read()).toBeNull()
    expect(storage.getItem('k')).toBeNull()

    storage.setItem('k', JSON.stringify({ other: 1 }))
    expect(item.read()).toBeNull()
    expect(storage.getItem('k')).toBeNull()
  })

  it('never throws when storage is blocked', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const storage = createBlockedStorage()
    const item = new StorageItem({
      key: 'k',
      parse: parseItem,
      getStorage: () => storage,
    })

    expect(item.read()).toBeNull()
    expect(item.write({ name: 'a' })).toBe(false)
    expect(item.remove()).toBe(false)
  })

  it('never throws when storage itself is unavailable', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const item = new StorageItem({
      key: 'k',
      parse: parseItem,
      getStorage: () => {
        throw new DOMException('denied', 'SecurityError')
      },
    })

    expect(item.read()).toBeNull()
    expect(item.write({ name: 'a' })).toBe(false)
  })
})
