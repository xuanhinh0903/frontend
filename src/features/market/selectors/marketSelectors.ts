import type { MarketRootState } from '../types'

export const selectConnection = (state: MarketRootState) => state.market.connection

export const selectQuote = (state: MarketRootState, symbol: string) =>
  state.market.quotes[symbol]

export const selectSubscriptionCount = (state: MarketRootState, symbol: string) =>
  state.market.subscriptions[symbol] ?? 0

export const selectSubscribedSymbols = (state: MarketRootState) =>
  Object.keys(state.market.subscriptions)
