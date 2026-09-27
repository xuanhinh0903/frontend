import { useAppDispatch } from '@/app/store/hooks'
import { useQuote } from '@/features/market'
import { formatChange, formatPrice } from '@/shared/utils'
import { symbolRemoved } from '../slices'

type WatchlistRowProps = { symbol: string }

export function WatchlistRow({ symbol }: WatchlistRowProps) {
  const dispatch = useAppDispatch()
  const quote = useQuote(symbol)
  const direction = quote && quote.change < 0 ? 'down' : 'up'

  function handleRemove() {
    dispatch(symbolRemoved(symbol))
  }

  return (
    <li className="watchlist__row">
      <span className="watchlist__symbol">{symbol}</span>
      <span className="watchlist__price">
        {quote ? formatPrice(quote.price) : '—'}
      </span>
      <span className={`watchlist__change watchlist__change--${direction}`}>
        {quote ? formatChange(quote.change) : ''}
      </span>
      <button
        type="button"
        className="watchlist__remove"
        aria-label={`Remove ${symbol}`}
        onClick={handleRemove}
      >
        ×
      </button>
    </li>
  )
}
