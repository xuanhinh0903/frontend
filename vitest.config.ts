import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    // Fixed endpoints so API and realtime code under test is deterministic.
    env: {
      VITE_API_URL: 'http://api.test',
      VITE_WS_URL: 'ws://ws.test/stream',
    },
  },
})
