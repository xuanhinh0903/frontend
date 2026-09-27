import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { symbolSubscriptionRequested, symbolUnsubscriptionRequested } from '../slices'
import { selectQuote } from '../selectors'

export function useQuote(symbol: string) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(symbolSubscriptionRequested(symbol))
    return () => {
      dispatch(symbolUnsubscriptionRequested(symbol))
    }
  }, [dispatch, symbol])

  return useAppSelector((state) => selectQuote(state, symbol))
}
