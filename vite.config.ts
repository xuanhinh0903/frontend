import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { msw } from 'msw/vite'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Serve (dev) or emit (e2e build) the MSW worker script only when mocking is on.
  // A production build never includes it.
  const mocking = env.VITE_API_MOCK === 'true'

  return {
    plugins: [react(), ...(mocking ? [msw({ mode: 'worker-only' })] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
