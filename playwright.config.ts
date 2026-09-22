import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`
const CI = Boolean(process.env.CI)

// Smoke and a11y specs run against the e2e build (VITE_API_MOCK=true) served by
// `vite preview`; the MSW worker in the page answers every API call.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  // Visual regression (none written yet). Baselines are platform-specific: capture
  // them only in the CI Playwright image, never on a developer machine.
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'yarn build:e2e && yarn preview:e2e',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
})
