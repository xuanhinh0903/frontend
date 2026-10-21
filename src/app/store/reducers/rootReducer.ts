import { combineReducers, type UnknownAction } from '@reduxjs/toolkit'
import { authReducer, logoutRequested } from '@/features/auth/slices'

const appReducer = combineReducers({
  auth: authReducer,
})

type AppState = ReturnType<typeof appReducer>

// Logout resets every slice so the next user never sees the previous user's data.
// The auth reducer still handles the action on its fresh state (-> 'unauthenticated').
export function rootReducer(
  state: AppState | undefined,
  action: UnknownAction,
) {
  return appReducer(logoutRequested.match(action) ? undefined : state, action)
}
