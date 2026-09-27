const BASE_DELAY_MS = 1_000

// Exponential backoff with jitter (50–100% of the capped delay).
export function reconnectDelay(
  attempt: number,
  maxDelayMs: number,
  random = Math.random,
): number {
  const capped = Math.min(maxDelayMs, BASE_DELAY_MS * 2 ** attempt)
  return Math.round(capped * (0.5 + random() / 2))
}
