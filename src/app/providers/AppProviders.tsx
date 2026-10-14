import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from './appStore'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
