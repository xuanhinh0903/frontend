import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

// Node-side MSW for the `ui` Vitest project. Started by src/test/setupMsw.ts.
export const server = setupServer(...handlers)
