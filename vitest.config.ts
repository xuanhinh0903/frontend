import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Two projects, split by environment (see .claude/rules/testing.md):
//   unit  node   src/**/*.test.ts              sagas, slices, utils, HTTP client
//   ui    jsdom  src/**/*.test.tsx             components and hooks with RTL
//                src/**/*.integration.test.ts  real store + sagas + MSW
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    env: {
      // Fixed endpoint so API code under test is deterministic.
      VITE_API_URL: 'http://api.test',
      // Market-hours logic assumes the Vietnamese exchange time zone; CI runners are UTC.
      TZ: 'Asia/Ho_Chi_Minh',
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'eslint-rules/**/*.test.js'],
          exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'src/**/*.integration.test.ts'],
          setupFiles: ['src/test/setup.ts', 'src/test/setupMsw.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        'src/test/**',
        'src/mocks/**',
        '**/*.types.ts',
        '**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Logic layers carry a floor; components are covered by behaviour tests, not a number.
      thresholds: {
        'src/shared/**': { lines: 70, branches: 70 },
        'src/features/**/{sagas,slices,utils}/**': { lines: 70, branches: 70 },
      },
    },
  },
})
