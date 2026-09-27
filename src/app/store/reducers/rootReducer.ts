import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from '@/shared/api'
import { authReducer, logoutRequested } from '@/features/auth/slices'
import { marketReducer } from '@/features/market/slices'
import { userPreferencesReducer } from '@/features/preferences/slices'
import { watchlistReducer } from '@/features/watchlist/slices'

const appReducer = combineReducers({
  auth: authReducer,
  userPreferences: userPreferencesReducer,
  watchlist: watchlistReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  market: marketReducer,
})

// Logout clears user-scoped data; userPreferences is a device setting and stays.
export const rootReducer: typeof appReducer = (state, action) =>
  appReducer(
    logoutRequested.match(action) && state
      ? { ...state, watchlist: undefined, market: undefined }
      : state,
    action,
  )
