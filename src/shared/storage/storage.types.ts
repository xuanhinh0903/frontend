export type StorageItemOptions<T> = {
  key: string
  // Validates the raw JSON; return null to reject it (the stored value is then dropped).
  parse: (value: unknown) => T | null
  // Resolved lazily: touching localStorage itself can throw in sandboxed frames.
  getStorage?: () => Storage
}
