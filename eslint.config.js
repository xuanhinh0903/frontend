import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

// Folder + barrel rule: from outside a folder, import its index.ts only.
const folderBarrelPatterns = [
  {
    regex: '^@/(app|features)/[^/]+/[^/]+/.+',
    message:
      "Import through the folder's index.ts (e.g. '@/features/auth/slices').",
  },
  {
    regex: '^@/(app/store/store|features/[^/]+/routes)$',
    message: "Import the module's root index.ts (e.g. '@/app/store').",
  },
  {
    regex: '^@/shared/[^/]+/.+',
    message: "Import through the folder's index.ts (e.g. '@/shared/api').",
  },
  {
    regex:
      '^(\\./|(\\.\\./)+)[^./][^/]*/(?!.*\\.(png|svg|jpe?g|webp|gif|css)$).+',
    message: "Import through the sibling folder's index.ts (e.g. '../slices').",
  },
]

// Function rule: declare functions first, then assign them by name (see AGENTS.md).
// Library config objects are exempt: their callbacks are the library's API.
const LIBRARY_CONFIG_CALLS = [
  'CallExpression[callee.name=/^(createSlice|createApi|configureStore|createSagaMiddleware)$/] *',
  'CallExpression[callee.property.name=/^(injectEndpoints|enhanceEndpoints|query|mutation)$/] *',
].join(', ')

const functionAssignmentRules = [
  {
    selector: 'JSXAttribute > JSXExpressionContainer > :function',
    message:
      'Do not pass an inline function as a prop. Declare the handler (function or useCallback) and pass it by name.',
  },
  {
    selector: `Property > :function.value:not(${LIBRARY_CONFIG_CALLS})`,
    message:
      'Do not assign an inline function (arrow, function expression or method shorthand) to an object property. Declare it first (function or useCallback) and assign it by name.',
  },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: folderBarrelPatterns,
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // Tests may use inline vi.mock factories and fake objects.
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...functionAssignmentRules],
    },
  },
  {
    // Features must not import the store root: it pulls in every slice (cycle).
    files: ['src/features/**/*.{ts,tsx}'],
    // Integration tests may build a real store with makeStore().
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...folderBarrelPatterns,
            {
              regex: '^@/app/store$',
              message:
                "Features import '@/app/store/hooks', not '@/app/store' (import cycle).",
            },
          ],
        },
      ],
    },
  },
])
