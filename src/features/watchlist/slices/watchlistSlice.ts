import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { logoutRequested } from '@/features/auth/slices'

type WatchlistState = { symbols: string[] }
const initialState: WatchlistState = { symbols: [] }

function resetWatchlist(): WatchlistState {
  return initialState
}

const watchlistSlice = createSlice({
  name: 'watchlist', initialState,
  reducers: {
    symbolAdded(state, action: PayloadAction<string>) { if (!state.symbols.includes(action.payload)) state.symbols.push(action.payload) },
    symbolRemoved(state, action: PayloadAction<string>) { state.symbols = state.symbols.filter((symbol) => symbol !== action.payload) },
  },
  extraReducers(builder) {
    builder.addCase(logoutRequested, resetWatchlist)
  },
})
export const { symbolAdded, symbolRemoved } = watchlistSlice.actions
export const watchlistReducer = watchlistSlice.reducer