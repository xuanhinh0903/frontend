// Collapses concurrent refresh attempts into one in-flight promise.
export function createRefreshQueue() {
  let pending: Promise<string> | null = null

  function run(refresh: () => Promise<string>): Promise<string> {
    pending ??= refresh().finally(() => {
      pending = null
    })
    return pending
  }

  return { run }
}
