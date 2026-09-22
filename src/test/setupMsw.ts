import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/test/mswServer'

// Any request without a handler fails the test: add the handler, do not stub fetch.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
