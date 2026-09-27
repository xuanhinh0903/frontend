import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { selectConnection } from '@/features/market'
import { normalizeSymbol } from '../utils'
import { symbolAdded } from '../slices'
import { WatchlistRow } from './WatchlistRow'

export function WatchlistPanel() {
  const dispatch = useAppDispatch()
  const symbols = useAppSelector((state) => state.watchlist.symbols)
  const connection = useAppSelector(selectConnection)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const symbol = normalizeSymbol(input)
    if (!symbol) {
      setError('Invalid symbol')
      return
    }
    dispatch(symbolAdded(symbol))
    setInput('')
    setError(null)
  }

  return (
    <section className="watchlist" aria-labelledby="watchlist-title">
      <header className="watchlist__header">
        <h2 id="watchlist-title" className="watchlist__title">
          Watchlist
        </h2>
        <span className={`watchlist__status watchlist__status--${connection}`}>
          {connection}
        </span>
      </header>
      <form className="watchlist__form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="symbol"
          value={input}
          onChange={handleInputChange}
          placeholder="Symbol, e.g. VNM"
          aria-label="Symbol"
          aria-invalid={error ? true : undefined}
        />
        <button type="submit">Add</button>
      </form>
      {error && (
        <p className="watchlist__error" role="alert">
          {error}
        </p>
      )}
      {symbols.length === 0 ? (
        <p className="watchlist__empty">No symbols yet.</p>
      ) : (
        <ul className="watchlist__list">
          {symbols.map((symbol) => (
            <WatchlistRow key={symbol} symbol={symbol} />
          ))}
        </ul>
      )}
    </section>
  )
}
