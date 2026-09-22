import { createElement, type ReactElement, type ReactNode } from 'react'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Store } from '@reduxjs/toolkit'
import type { InitialEntry } from 'react-router'
import { makeTestStore, type TestPreloadedState } from '@/test/makeTestStore'
import { TestProviders } from '@/test/TestProviders'

type ProviderOptions = {
  preloadedState?: TestPreloadedState
  // Where the router starts; pass an object to seed `location.state`.
  route?: InitialEntry
}

type WrapperProps = { children: ReactNode }

export function createWrapper(store: Store, route: InitialEntry = '/') {
  function Wrapper({ children }: WrapperProps) {
    return createElement(TestProviders, {
      store,
      initialEntries: [route],
      children,
    })
  }
  return Wrapper
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    route,
    ...renderOptions
  }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { store, actions } = makeTestStore(preloadedState)
  const user = userEvent.setup()
  const wrapper = createWrapper(store, route)
  return { store, actions, user, ...render(ui, { wrapper, ...renderOptions }) }
}

export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  {
    preloadedState,
    route,
    ...hookOptions
  }: ProviderOptions & Omit<RenderHookOptions<Props>, 'wrapper'> = {},
) {
  const { store, actions } = makeTestStore(preloadedState)
  const wrapper = createWrapper(store, route)
  return { store, actions, ...renderHook(hook, { wrapper, ...hookOptions }) }
}
