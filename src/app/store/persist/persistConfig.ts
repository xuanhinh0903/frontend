import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { rootReducer } from '../reducers'

type RootReducerState = ReturnType<typeof rootReducer>

const persistConfig = {
  key: 'msvn',
  storage,
  whitelist: ['userPreferences', 'watchlist'] satisfies (keyof RootReducerState)[],
}

export const persistedReducer = persistReducer(persistConfig, rootReducer)

// redux-persist actions carry functions; exclude them from the serializable check.
export const PERSIST_ACTIONS = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
