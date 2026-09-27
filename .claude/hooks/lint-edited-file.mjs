// PostToolUse hook: lint the file Claude just edited and report errors back (exit 2).
import { spawnSync } from 'node:child_process'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk

let filePath
try {
  filePath = JSON.parse(input).tool_input?.file_path
} catch {
  process.exit(0)
}

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const relative = filePath ? path.relative(projectDir, path.resolve(projectDir, filePath)) : ''
if (!/^src\/.*\.tsx?$/.test(relative)) process.exit(0)

const result = spawnSync('yarn', ['-s', 'eslint', relative], { cwd: projectDir, encoding: 'utf8' })
if (result.status === 0) process.exit(0)

process.stderr.write(
  `ESLint failed for ${relative}. Fix these before continuing (see AGENTS.md, Code conventions):\n` +
    `${result.stdout}${result.stderr}`,
)
process.exit(2)
