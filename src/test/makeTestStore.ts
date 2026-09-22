import {
  configureStore,
  type Middleware,
  type UnknownAction,
} from '@reduxjs/toolkit'
import { rootReducer } from '@/app/store/reducers'
import type { RootState } from '@/app/store'

// Each slice may be given partially; the rest comes from the slice's initial state.
export type TestPreloadedState = {
  [Slice in keyof RootState]?: Partial<RootState[Slice]>
}

function buildState(preloaded: TestPreloadedState): RootState {
  const initial = rootReducer(undefined, { type: '@@test/INIT' })
  const slices = Object.entries(preloaded).map(([key, slice]) => [
    key,
    { ...initial[key as keyof RootState], ...slice },
  ])
  return { ...initial, ...(Object.fromEntries(slices) as Partial<RootState>) }
}

// A store with the real reducers and no sagas: component tests assert the actions
// a component dispatches and how it renders a given state. Integration tests use makeStore().
export function makeTestStore(preloaded: TestPreloadedState = {}) {
  const actions: UnknownAction[] = []
  const recordActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction)
    return next(action)
  }

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: buildState(preloaded),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(recordActions),
  })

  return { store, actions }
}

export type TestStore = ReturnType<typeof makeTestStore>['store']
