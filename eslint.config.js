import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import vitest from '@vitest/eslint-plugin'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'
import playwright from 'eslint-plugin-playwright'
import { defineConfig, globalIgnores } from 'eslint/config'
import barrelBoundary from './eslint-rules/barrel-boundary.js'
import tsxRequiresJsx from './eslint-rules/tsx-requires-jsx.js'

/** @typedef {{ selector: string, message: string }} SyntaxRule */
/** @typedef {import('eslint').Linter.RulesRecord} RulesRecord */

// In flat config a later block REPLACES an earlier `no-restricted-syntax` or
// `no-restricted-imports`; it does not merge. `syntaxRules` and `importRules` always
// prepend the rules every scope needs, so no block can drop them by accident.

// ── no-restricted-syntax ────────────────────────────────────────────────────

// Relative paths that no-restricted-imports cannot see: import() and vi.mock & co.
/** @type {SyntaxRule[]} */
const RELATIVE_CALLS = [
  {
    selector: 'ImportExpression > Literal[value=/^\\.{1,2}\\//]',
    message: "Use the '@/' alias in import(), never a relative path.",
  },
  {
    selector:
      "CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock|unmock|importActual|importMock)$/] > Literal:first-child[value=/^\\.{1,2}\\//]",
    message: "Use the '@/' alias in vi.mock(), never a relative path.",
  },
]

// Function rule: declare functions first, then assign them by name (see .claude/rules/conventions.md).
// Library config objects are exempt: their callbacks are the library's API.
const LIBRARY_CONFIG_CALLS =
  'CallExpression[callee.name=/^(createSlice|configureStore|createSagaMiddleware)$/] *'

/** @type {SyntaxRule[]} */
const FUNCTION_ASSIGNMENT = [
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

// .tsx holds UI only: top-level functions are components (PascalCase), and the only
// type it declares is the component's props.
const HELPER_IN_TSX =
  'No helper functions in .tsx: a top-level function must be a component (PascalCase). Move helpers to utils/ and hooks to hooks/ (.ts files).'
const TYPE_IN_TSX =
  'A .tsx file declares only its `*Props` type. Move other types to a `*.types.ts` file.'
const FUNCTION_INIT =
  '[init.type=/^(ArrowFunctionExpression|FunctionExpression)$/]'

/** @type {SyntaxRule[]} */
const TSX_ONLY_UI = [
  {
    selector: 'Program > FunctionDeclaration[id.name=/^[a-z]/]',
    message: HELPER_IN_TSX,
  },
  {
    selector:
      'Program > ExportNamedDeclaration > FunctionDeclaration[id.name=/^[a-z]/]',
    message: HELPER_IN_TSX,
  },
  {
    selector: `Program > VariableDeclaration > VariableDeclarator[id.name=/^[a-z]/]${FUNCTION_INIT}`,
    message: HELPER_IN_TSX,
  },
  {
    selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^[a-z]/]${FUNCTION_INIT}`,
    message: HELPER_IN_TSX,
  },
  {
    selector: 'TSTypeAliasDeclaration[id.name!=/Props$/]',
    message: TYPE_IN_TSX,
  },
  {
    selector: 'TSInterfaceDeclaration[id.name!=/Props$/]',
    message: TYPE_IN_TSX,
  },
]

/**
 * @param {SyntaxRule[]} rules
 * @returns {RulesRecord}
 */
function syntaxRules(...rules) {
  return { 'no-restricted-syntax': ['error', ...RELATIVE_CALLS, ...rules] }
}

// ── no-restricted-imports ───────────────────────────────────────────────────
// Import rules (see .claude/rules/conventions.md and architecture.md).

/** @typedef {{ group?: string[], regex?: string, message: string }} ImportPattern */

/** @type {ImportPattern} */
const RELATIVE = {
  group: ['./*', '../*'],
  message: "Use the '@/' alias, never a relative path.",
}
/** @type {ImportPattern} */
const NO_TEST = {
  regex: '^@/test(/|$)',
  message: "'@/test' is for test files only. App code never imports it.",
}
/** @type {ImportPattern} */
const NO_MOCKS = {
  regex: '^@/mocks(/|$)',
  message:
    "'@/mocks' is imported only by src/main.tsx (boot) and tests. App code calls the API through sagas.",
}
/** @type {ImportPattern} */
const NO_APP_STORE_ROOT = {
  regex: '^@/app/store$',
  message:
    "Features import '@/app/store/hooks', not '@/app/store' (import cycle).",
}
/** @type {ImportPattern} */
const SHARED_LAYER = {
  regex: '^@/(app|features|mocks|test)(/|$)',
  message:
    'src/shared must not depend on app, features, mocks or test. Pass what it needs in (see bindApiClient).',
}
/** @type {ImportPattern} */
const E2E_SRC = {
  regex: '^@/(?!mocks/account$)',
  message:
    "Specs run outside Vite: '@/mocks/account' is the only src/ module they may import.",
}

/**
 * @param {ImportPattern[]} patterns
 * @returns {RulesRecord}
 */
function importRules(...patterns) {
  return {
    'no-restricted-imports': ['error', { patterns: [RELATIVE, ...patterns] }],
  }
}

const TEST_FILES = ['**/*.test.{ts,tsx}']
const NON_APP_FILES = [
  ...TEST_FILES,
  'src/test/**',
  'src/mocks/**',
  'src/main.tsx',
]
const E2E_FILES = ['e2e/**/*.ts', 'playwright.config.ts']

export default defineConfig([
  globalIgnores([
    '.claude',
    '.cursor',
    '.code-review-graph',
    'coverage',
    'dist',
    'dist-e2e',
    'node_modules',
    'playwright-report',
    'test-results',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A switch over a union (status, side, order type) must handle every member.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        { allowConstantLoopConditions: 'only-allowed-literals' },
      ],
      // ApiError is a plain object on purpose: it travels through Redux actions and state.
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'file',
              name: 'ApiError',
              path: 'src/shared/api/types/api.types.ts',
            },
          ],
        },
      ],
    },
  },
  {
    // redux-saga types every `yield` result as `any`, and `call([ctx, fn])` binds `this`.
    files: ['src/**/sagas/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      local: {
        rules: {
          'barrel-boundary': barrelBoundary,
          'tsx-requires-jsx': tsxRequiresJsx,
        },
      },
    },
    rules: {
      // Folder and barrel boundaries: an import that is right or wrong depending on
      // which file makes it, so it needs a rule, not a pattern.
      'local/barrel-boundary': 'error',
      'local/tsx-requires-jsx': 'error',
    },
  },
  // no-restricted-syntax, from the widest scope to the narrowest (last match wins).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    rules: syntaxRules(...FUNCTION_ASSIGNMENT),
  },
  {
    // The boot entry is the one .tsx that is not a component module.
    files: ['src/**/*.tsx'],
    ignores: [...TEST_FILES, 'src/main.tsx'],
    rules: syntaxRules(...FUNCTION_ASSIGNMENT, ...TSX_ONLY_UI),
  },
  {
    // Tests may use inline vi.mock factories, fakes and helpers.
    files: [...TEST_FILES, ...E2E_FILES],
    rules: syntaxRules(),
  },
  // no-restricted-imports, from the widest scope to the narrowest (last match wins).
  {
    // App code: no test helpers, no mock backend.
    files: ['src/**/*.{ts,tsx}'],
    ignores: NON_APP_FILES,
    rules: importRules(NO_TEST, NO_MOCKS),
  },
  {
    // Features must not import the store root: it pulls in every slice (cycle).
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: NON_APP_FILES,
    rules: importRules(NO_TEST, NO_MOCKS, NO_APP_STORE_ROOT),
  },
  {
    // Tests, test helpers, the mock backend and the boot entry may use @/test and @/mocks.
    files: NON_APP_FILES,
    rules: importRules(),
  },
  {
    // Shared is the bottom layer, tests included.
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: importRules(SHARED_LAYER),
  },
  {
    files: E2E_FILES,
    rules: importRules(E2E_SRC),
  },
  {
    // Vitest tests: unit (node), component (jsdom) and integration (see .claude/rules/testing.md).
    files: ['src/**/*.test.{ts,tsx}'],
    extends: [vitest.configs.recommended, jestDom.configs['flat/recommended']],
    rules: {
      // Fakes are async without awaiting, reject with ApiError, and pass vi.fn methods around.
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // Component and hook tests query like a user would: by role, label, text.
    files: ['src/**/*.test.tsx'],
    extends: [testingLibrary.configs['flat/react']],
  },
  {
    files: E2E_FILES,
    extends: [playwright.configs['flat/recommended']],
  },
])
