// `.tsx` is only for files that render UI (.claude/rules/conventions.md). A .tsx file
// without any JSX is logic, config or types, and belongs in a .ts file.

/** @type {import('eslint').Rule.RuleModule} */
const tsxRequiresJsx = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSX in .tsx files; everything else is .ts.',
    },
    schema: [],
    messages: {
      noJsx:
        'This .tsx file renders no UI. Rename it to .ts (.tsx is only for components, pages, layouts and providers).',
    },
  },
  create(context) {
    if (!context.filename.endsWith('.tsx')) return {}
    let hasJsx = false

    function markJsx() {
      hasJsx = true
    }

    /** @param {import('estree').Program} node */
    function report(node) {
      if (!hasJsx) context.report({ node, messageId: 'noJsx' })
    }

    return {
      JSXElement: markJsx,
      JSXFragment: markJsx,
      'Program:exit': report,
    }
  },
}

export default tsxRequiresJsx
