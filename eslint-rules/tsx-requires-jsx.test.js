import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import tsxRequiresJsx from './tsx-requires-jsx.js'

// Vitest runs without globals; RuleTester needs describe/it to register cases.
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run('tsx-requires-jsx', tsxRequiresJsx, {
  valid: [
    {
      name: 'component rendering an element',
      filename: 'src/shared/components/Box.tsx',
      code: 'export function Box() { return <div /> }',
    },
    {
      name: 'component rendering a fragment',
      filename: 'src/shared/components/Empty.tsx',
      code: 'export function Empty() { return <></> }',
    },
    {
      name: '.ts files are not checked',
      filename: 'src/shared/utils/sum.ts',
      code: 'export const sum = 1 + 1',
    },
  ],
  invalid: [
    {
      name: '.tsx without JSX',
      filename: 'src/features/auth/routes.tsx',
      code: 'export const routes = []',
      errors: [{ messageId: 'noJsx' }],
    },
  ],
})
