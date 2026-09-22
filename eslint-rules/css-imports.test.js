// ESLint does not read CSS, so the alias rule for CSS `@import` is checked here
// (.claude/rules/conventions.md: relative paths are banned in CSS `@import` too).
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.join(process.cwd(), 'src')
const RELATIVE_IMPORT = /@import\s+(?:url\(\s*)?["']\.{1,2}\//

const cssFiles = fs
  .readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((rel) => rel.endsWith('.css'))

describe('CSS @import', () => {
  it('finds the stylesheets to check', () => {
    expect(cssFiles.length).toBeGreaterThan(0)
  })

  it.each(cssFiles)("%s uses the '@/' alias, never a relative path", (rel) => {
    const css = fs.readFileSync(path.join(SRC, rel), 'utf8')
    expect(css).not.toMatch(RELATIVE_IMPORT)
  })
})
