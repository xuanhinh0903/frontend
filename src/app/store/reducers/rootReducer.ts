import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from '@/shared/api'
import { authReducer } from '@/features/auth/slices'
import { marketReducer } from '@/features/market/slices'
import { userPreferencesReducer } from '@/features/preferences/slices'
import { watchlistReducer } from '@/features/watchlist/slices'

// Logout resets auth, watchlist, and market inside those slices.
// userPreferences is a device setting and stays.
export const rootReducer = combineReducers({
  auth: authReducer,
  userPreferences: userPreferencesReducer,
  watchlist: watchlistReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  market: marketReducer,
})
