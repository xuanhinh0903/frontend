import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableMocking } from '@/mocks'
import '@/index.css'

// The store is created (and restoreSession fires its first request) when `@/app`
// is evaluated, so the app is imported only after the mock worker owns the network.
async function bootstrap() {
  await enableMocking()
  const { App } = await import('@/app')
  const container = document.getElementById('root')
  if (!container) throw new Error('index.html has no #root element')
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Without this, a mock worker or chunk that fails to load leaves a blank page and no log.
bootstrap().catch((error: unknown) => {
  console.error('[boot] the app failed to start', error)
})
