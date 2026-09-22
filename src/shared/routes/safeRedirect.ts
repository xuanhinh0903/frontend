import { PATHS } from './paths'

/** Allow only same-app absolute paths (block protocol-relative / open redirects). */
export function resolveSafeRedirect(
  candidate: string | null | undefined,
  fallback: string = PATHS.home,
): string {
  if (!candidate) return fallback
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return fallback
  return candidate
}
