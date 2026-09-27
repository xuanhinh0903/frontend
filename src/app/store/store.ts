import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { persistStore } from 'redux-persist'
import { baseApi } from '@/shared/api'
import { bindApiClient } from './api'
import { PERSIST_ACTIONS, persistedReducer } from './persist'
import { rootSaga } from './sagas'

export function Store() {
  const sagaMiddleware = createSagaMiddleware({
    onError: (error) => console.error('[saga]', error),
  })

  const store = configureStore({
    reducer: persistedReducer,
    devTools: import.meta.env.DEV,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: PERSIST_ACTIONS },
      }).concat(sagaMiddleware, baseApi.middleware),
  })

  // Bind before sagas start: restoreSession and feature sagas may call the API.
  bindApiClient(store)
  sagaMiddleware.run(rootSaga)
  const persistor = persistStore(store)

  return { store, persistor }
}
