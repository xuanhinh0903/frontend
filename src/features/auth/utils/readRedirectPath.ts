import { isRecord } from '@/shared/utils'

// Router state is `unknown` (it survives reloads and can be set by any navigation),
// so read RequireAuth's `{ from: { pathname } }` defensively.
export function readRedirectPath(state: unknown): string | undefined {
  if (!isRecord(state) || !isRecord(state.from)) return undefined
  const { pathname } = state.from
  return typeof pathname === 'string' ? pathname : undefined
}
