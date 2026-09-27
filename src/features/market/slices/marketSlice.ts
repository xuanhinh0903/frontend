import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ConnectionStatus, MarketState, Quote } from '../types'

const initialState: MarketState = {
  connection: 'disconnected',
  subscriptions: {},
  quotes: {},
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    realtimeStarted(state) {
      if (state.connection === 'disconnected') state.connection = 'connecting'
    },
    realtimeStopped(state) {
      state.connection = 'disconnected'
    },
    connectionChanged(state, action: PayloadAction<ConnectionStatus>) {
      state.connection = action.payload
    },
    symbolSubscriptionRequested(state, action: PayloadAction<string>) {
      state.subscriptions[action.payload] = (state.subscriptions[action.payload] ?? 0) + 1
    },
    symbolUnsubscriptionRequested(state, action: PayloadAction<string>) {
      const count = state.subscriptions[action.payload] ?? 0
      if (count > 1) state.subscriptions[action.payload] = count - 1
      else delete state.subscriptions[action.payload]
    },
    quoteUpdated(state, action: PayloadAction<Quote>) {
      state.quotes[action.payload.symbol] = action.payload
    },
  },
})

export const {
  realtimeStarted, realtimeStopped, connectionChanged,
  symbolSubscriptionRequested, symbolUnsubscriptionRequested, quoteUpdated,
} = marketSlice.actions
export const marketReducer = marketSlice.reducer
