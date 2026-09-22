// Enforces the folder and barrel rules in .claude/rules/conventions.md:
//   - from outside a folder, import its index (`@/features/auth/hooks`), never a file in it;
//   - a file may import, by full path, files in its own folder or in an ancestor folder;
//   - a file never imports its own folder's index (or an ancestor's): import cycle;
//   - folders inside a shared module (`src/shared/<module>/<sub>`) are internal to it;
//   - dynamic `import()` of a page file is the lazy-page exception.
// The rule resolves `@/x` to `<cwd>/src/x` and checks the file system to tell a
// folder (barrel) from a file.

import fs from 'node:fs'
import path from 'node:path'

const ALIAS = '@/'

/**
 * @param {string} dir
 * @param {string} ancestor
 */
function isInside(dir, ancestor) {
  return dir === ancestor || dir.startsWith(ancestor + path.sep)
}

/** @param {string} target */
function isDirectory(target) {
  return fs.existsSync(target) && fs.statSync(target).isDirectory()
}

/**
 * @param {string} srcDir
 * @param {string} target
 */
function toAlias(srcDir, target) {
  return ALIAS + path.relative(srcDir, target).split(path.sep).join('/')
}

/** @param {import('eslint').Rule.RuleContext} context */
function create(context) {
  const srcDir = path.join(context.cwd, 'src')
  const importerDir = path.dirname(context.filename)

  /**
   * @param {import('estree').Literal} sourceNode
   * @param {{ dynamic: boolean }} options
   */
  function check(sourceNode, { dynamic }) {
    const spec = sourceNode.value
    if (typeof spec !== 'string' || !spec.startsWith(ALIAS)) return
    const target = path.join(srcDir, spec.slice(ALIAS.length))

    if (isDirectory(target)) {
      if (isInside(importerDir, target)) {
        context.report({
          node: sourceNode,
          messageId: 'ownBarrel',
          data: { spec },
        })
        return
      }
    } else {
      const targetDir = path.dirname(target)
      const lazyPage = dynamic && target.split(path.sep).includes('pages')
      if (!lazyPage && !isInside(importerDir, targetDir)) {
        context.report({
          node: sourceNode,
          messageId: 'deepImport',
          data: { spec, barrel: toAlias(srcDir, targetDir) },
        })
        return
      }
    }

    const [top, module, ...rest] = path.relative(srcDir, target).split(path.sep)
    if (top === 'shared' && module && rest.length > 0) {
      const moduleDir = path.join(srcDir, 'shared', module)
      if (!isInside(importerDir, moduleDir)) {
        context.report({
          node: sourceNode,
          messageId: 'sharedInternal',
          data: { spec, module: `${ALIAS}shared/${module}` },
        })
      }
    }
  }

  /**
   * @param {import('estree').ImportDeclaration | import('estree').ExportNamedDeclaration | import('estree').ExportAllDeclaration} node
   */
  function checkStatic(node) {
    if (node.source) check(node.source, { dynamic: false })
  }

  /** @param {import('estree').ImportExpression} node */
  function checkDynamic(node) {
    if (node.source.type === 'Literal') check(node.source, { dynamic: true })
  }

  return {
    ImportDeclaration: checkStatic,
    ExportNamedDeclaration: checkStatic,
    ExportAllDeclaration: checkStatic,
    ImportExpression: checkDynamic,
  }
}

/** @type {import('eslint').Rule.RuleModule} */
const barrelBoundary = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Import folders through their index.ts; files only from the same or an ancestor folder.',
    },
    schema: [],
    messages: {
      deepImport:
        "'{{spec}}' reaches into another folder. Import its index instead: '{{barrel}}'.",
      ownBarrel:
        "'{{spec}}' is the index of the folder this file lives in (import cycle). Import the file by its full path.",
      sharedInternal:
        "'{{spec}}' is internal to {{module}}. Import '{{module}}' instead.",
    },
  },
  create,
}

export default barrelBoundary
