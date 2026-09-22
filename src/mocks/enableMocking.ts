// Both conditions fold to constants at build time, so a production build
// contains neither this branch nor the msw chunk (verified by `grep msw dist/assets`).
const MOCKING_ALLOWED = import.meta.env.DEV || import.meta.env.MODE === 'e2e'

export async function enableMocking(): Promise<void> {
  if (!MOCKING_ALLOWED || import.meta.env.VITE_API_MOCK !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}
