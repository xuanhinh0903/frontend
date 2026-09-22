// Collapses concurrent refresh attempts into one in-flight promise.
export type RefreshQueue = {
  run: (refresh: () => Promise<string>) => Promise<string>
}

export function createRefreshQueue(): RefreshQueue {
  let pending: Promise<string> | null = null

  function run(refresh: () => Promise<string>): Promise<string> {
    pending ??= refresh().finally(() => {
      pending = null
    })
    return pending
  }

  return { run }
}
