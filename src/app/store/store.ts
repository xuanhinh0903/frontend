import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { bindApiClient } from '@/app/store/api'
import { rootReducer } from '@/app/store/reducers'
import { rootSaga } from '@/app/store/sagas'

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware({
    onError: (error) => console.error('[saga]', error),
  })

  const store = configureStore({
    reducer: rootReducer,
    devTools: import.meta.env.DEV,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(sagaMiddleware),
  })

  // Bind before sagas start: restoreSession and feature sagas may call the API.
  bindApiClient(store)
  sagaMiddleware.run(rootSaga)

  return { store }
}
