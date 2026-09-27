import { Store } from '@/app/store'

// The app's single store instance. Tests call Store() for isolated stores.
export const { store, persistor } = Store()
