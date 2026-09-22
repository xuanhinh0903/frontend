import type { ReactNode } from 'react'
import type { Store } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, type InitialEntry } from 'react-router'

type TestProvidersProps = {
  store: Store
  initialEntries: InitialEntry[]
  children: ReactNode
}

// Mirrors AppProviders + the router for tests. Accepts any store so integration
// tests can pass the real makeStore() store.
export function TestProviders({
  store,
  initialEntries,
  children,
}: TestProvidersProps) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  )
}
