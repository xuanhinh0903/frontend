import { makeStore } from '@/app/store'

// The app's single store instance. Tests call makeStore() for isolated stores.
export const { store, persistor } = makeStore()
