import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type WatchlistState = { symbols: string[] }
const initialState: WatchlistState = { symbols: [] }
const watchlistSlice = createSlice({
  name: 'watchlist', initialState,
  reducers: {
    symbolAdded(state, action: PayloadAction<string>) { if (!state.symbols.includes(action.payload)) state.symbols.push(action.payload) },
    symbolRemoved(state, action: PayloadAction<string>) { state.symbols = state.symbols.filter((symbol) => symbol !== action.payload) },
  },
})
export const { symbolAdded, symbolRemoved } = watchlistSlice.actions
export const watchlistReducer = watchlistSlice.reducer