import path from 'node:path'
import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import barrelBoundary from './barrel-boundary.js'

// Vitest runs without globals; RuleTester needs describe/it to register cases.
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

// The rule reads the real src/ tree to tell folders from files.
const ROOT = process.cwd()

/** @param {string} rel */
function file(rel) {
  return path.join(ROOT, rel)
}

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
})

ruleTester.run('barrel-boundary', barrelBoundary, {
  valid: [
    {
      name: 'sibling file by full path',
      filename: file('src/features/auth/hooks/useLoginForm.ts'),
      code: "import { useAuth } from '@/features/auth/hooks/useAuth'",
    },
    {
      name: 'barrel re-exports a sibling file',
      filename: file('src/features/auth/hooks/index.ts'),
      code: "export { useAuth } from '@/features/auth/hooks/useAuth'",
    },
    {
      name: 'file in an ancestor folder',
      filename: file('src/mocks/handlers/auth.ts'),
      code: "import { MOCK_ACCOUNT } from '@/mocks/account'",
    },
    {
      name: 'folder index from outside the folder',
      filename: file('src/app/store/reducers/rootReducer.ts'),
      code: "import { authReducer } from '@/features/auth/slices'",
    },
    {
      name: 'shared module root from outside',
      filename: file('src/features/auth/services/authApi.ts'),
      code: "import { httpClient } from '@/shared/api'",
    },
    {
      name: 'shared sub-folder from inside the module',
      filename: file('src/shared/api/services/httpClient.ts'),
      code: "import { ApiError } from '@/shared/api/types'",
    },
    {
      name: 'lazy page dynamic import',
      filename: file('src/features/auth/routes.ts'),
      code: "const page = import('@/features/auth/pages/LoginPage')",
    },
    {
      name: 'package imports are ignored',
      filename: file('src/app/router.ts'),
      code: "import { createBrowserRouter } from 'react-router'",
    },
  ],
  invalid: [
    {
      name: 'file inside another folder',
      filename: file('src/routes/app.ts'),
      code: "import { useAuth } from '@/features/auth/hooks/useAuth'",
      errors: [{ messageId: 'deepImport' }],
    },
    {
      name: 're-export of a file inside another folder',
      filename: file('src/features/auth/index.ts'),
      code: "export { useAuth } from '@/features/auth/hooks/useAuth'",
      errors: [{ messageId: 'deepImport' }],
    },
    {
      name: 'own folder index',
      filename: file('src/features/auth/hooks/useLoginForm.ts'),
      code: "import { useAuth } from '@/features/auth/hooks'",
      errors: [{ messageId: 'ownBarrel' }],
    },
    {
      name: 'ancestor folder index',
      filename: file('src/app/store/types/store.types.ts'),
      code: "import { makeStore } from '@/app/store'",
      errors: [{ messageId: 'ownBarrel' }],
    },
    {
      name: 'shared module internal folder',
      filename: file('src/features/auth/services/authApi.ts'),
      code: "import { ApiError } from '@/shared/api/types'",
      errors: [{ messageId: 'sharedInternal' }],
    },
    {
      name: 'dynamic import of a non-page file',
      filename: file('src/app/App.tsx'),
      code: "const hooks = import('@/features/auth/hooks/useAuth')",
      errors: [{ messageId: 'deepImport' }],
    },
  ],
})
