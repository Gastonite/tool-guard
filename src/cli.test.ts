import { execFileSync, execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'



const CLI_PATH = join(process.cwd(), 'dist/cli.js')
const CONFIG_PATH = '.claude/guard.config.ts'
const DIST = `${process.cwd()}/dist`

const hookInput = (toolName: string, toolInput: Record<string, unknown>) => JSON.stringify({
  session_id: 'test',
  transcript_path: '/tmp/t',
  cwd: '/tmp',
  permission_mode: 'default',
  hook_event_name: 'PreToolUse',
  tool_name: toolName,
  tool_input: toolInput,
  tool_use_id: 'test-id',
})

let projectDirectory: string

beforeAll(() => {

  execSync('pnpm build', { stdio: 'pipe' })
}, 30_000)

beforeEach(() => {

  projectDirectory = mkdtempSync(join(tmpdir(), 'guard-cli-'))
  mkdirSync(join(projectDirectory, '.claude'), { recursive: true })
})

afterEach(() => {

  rmSync(projectDirectory, { recursive: true })
})

const writeConfig = (content: string) => {

  writeFileSync(join(projectDirectory, CONFIG_PATH), content)
}

const run = (toolName: string, toolInput: Record<string, unknown>) => {

  const stdout = execFileSync('node', [CLI_PATH], {
    input: hookInput(toolName, toolInput),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
    encoding: 'utf8',
  })

  return JSON.parse(stdout) as {
    hookSpecificOutput: {
      hookEventName: string
      permissionDecision: string
      permissionDecisionReason?: string
    }
  }
}

const runRaw = (input: string) => {

  try {

    const stdout = execFileSync('node', [CLI_PATH], {
      input,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory },
      encoding: 'utf8',
    })

    return { exitCode: 0, stdout }
  } catch (error) {

    const processError = error as { status: number; stdout: string }

    return { exitCode: processError.status, stdout: processError.stdout }
  }
}

describe('cli', () => {

  describe('simple cases', () => {

    it('allows tool with boolean true policy', () => {

      writeConfig('export default { Read: true }')
      const result = run('Read', { file_path: 'test.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('denies tool with boolean false policy', () => {

      writeConfig('export default { Read: false }')
      const result = run('Read', { file_path: 'test.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('denies tool not in config', () => {

      writeConfig('export default { Read: true }')
      const result = run('Write', { file_path: 'test.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
      expect(result.hookSpecificOutput.permissionDecisionReason).toContain('No policy')
    })

    it('denies when no config file', () => {

      const result = run('Read', { file_path: 'test.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
      expect(result.hookSpecificOutput.permissionDecisionReason).toContain('No permissions config')
    })

    it('denies on invalid stdin JSON', () => {

      const { exitCode, stdout } = runRaw('not json')
      expect(exitCode).toBe(1)
      const output = JSON.parse(stdout)
      expect(output.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('denies on loadConfig error', () => {

      writeConfig(`export default 'not an object'`)
      const { exitCode, stdout } = runRaw(hookInput('Read', { file_path: 'test.ts' }))
      expect(exitCode).toBe(1)
      const output = JSON.parse(stdout)
      expect(output.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('includes tool name and input in deny message', () => {

      writeConfig('export default { Read: false }')
      const result = run('Read', { file_path: 'test.ts' })
      expect(result.hookSpecificOutput.permissionDecisionReason).toContain('Read')
      expect(result.hookSpecificOutput.permissionDecisionReason).toContain('test.ts')
    })
  })

  describe('smoke test', () => {

    beforeEach(() => {

      writeConfig(`import { command, spread } from '${DIST}/command.js'
import { greedy } from '${DIST}/extractables/greedy.js'
import { safeBranch } from '${DIST}/extractables/safeBranch.js'
import { safeCommitHash } from '${DIST}/extractables/safeCommitHash.js'
import { safeString } from '${DIST}/extractables/safeString.js'
import { BashToolGuard } from '${DIST}/guards/bash.js'
import { ReadToolGuard } from '${DIST}/guards/read.js'
import { WriteToolGuard } from '${DIST}/guards/write.js'
import { GrepToolGuard } from '${DIST}/guards/grep.js'
import { GlobToolGuard } from '${DIST}/guards/glob.js'
import { WebFetchToolGuard } from '${DIST}/guards/webFetch.js'
import { TaskToolGuard } from '${DIST}/guards/task.js'
import { ReadMcpResourceToolGuard } from '${DIST}/guards/readMcpResource.js'

export default {
  TodoRead: true,

  Bash: BashToolGuard(
    {
      allow: [
        command${'`'}git ${'${'}spread(greedy)}${'`'},
        command${'`'}git checkout ${'${'}safeBranch}${'`'},
        command${'`'}git show ${'${'}safeCommitHash}${'`'},
        command${'`'}git commit -m ${'${'}safeString}${'`'},
        command${'`'}pnpm ${'${'}spread(greedy)}${'`'},
      ],
      deny: [command${'`'}git push --force ${'${'}greedy}${'`'}],
    },
    { deny: [command${'`'}rm ${'${'}greedy}${'`'}] },
  ),

  Read: ReadToolGuard({
    allow: ['src/**', 'tests/**'],
    deny: ['*env'],
  }),

  Write: WriteToolGuard({ allow: ['src/**'] }),

  Grep: GrepToolGuard({
    allow: [{ pattern: ['*'], path: ['src/**'] }],
    deny: [{ pattern: ['password'] }],
  }),

  Glob: GlobToolGuard({ allow: ['src/**'] }),

  WebFetch: WebFetchToolGuard({
    allow: ['https://*'],
    deny: ['*evil*'],
  }),

  Task: TaskToolGuard({ allow: ['Explore', 'Plan'] }),

  ReadMcpResource: ReadMcpResourceToolGuard({
    allow: [{ server: ['my-server'], uri: ['resource://*'] }],
    deny: [{ uri: ['resource://secret*'] }],
  }),
}
`)
    })

    // --- Boolean policy ---

    it('#1 TodoRead boolean true — allow', () => {

      const result = run('TodoRead', {})
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    // --- Bash: command template + extractables ---

    it('#2 Bash git status — command template + greedy + spread', () => {

      const result = run('Bash', { command: 'git status' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#3 Bash git checkout — safeBranch (CharsetExtractable)', () => {

      const result = run('Bash', { command: 'git checkout feature/x' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#4 Bash git show — safeCommitHash (FixedLengthExtractableFactory)', () => {

      const result = run('Bash', { command: 'git show a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#5 Bash git commit -m — safeString (extractSafeString + unquote)', () => {

      const result = run('Bash', { command: 'git commit -m "fix bug"' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#6 Bash composed command — splitComposedCommand + per-part validation', () => {

      const result = run('Bash', { command: 'git status && pnpm test' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#7 Bash git push --force — scopedDeny', () => {

      const result = run('Bash', { command: 'git push --force origin main' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#8 Bash rm — globalDeny (deny-only policy)', () => {

      const result = run('Bash', { command: 'rm -rf /' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#9 Bash curl — noMatch (no template matches)', () => {

      const result = run('Bash', { command: 'curl evil.com' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#10 Bash composed with denied part — splitComposedCommand + deny', () => {

      const result = run('Bash', { command: 'git status || rm -rf /' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Read: PathExtractable + picomatch ---

    it('#11 Read src/app.ts — path allow', () => {

      const result = run('Read', { file_path: 'src/app.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#12 Read .env — deny (matches deny pattern)', () => {

      const result = run('Read', { file_path: '.env' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#13 Read /etc/shadow — deny (external path, no external: pattern)', () => {

      const result = run('Read', { file_path: '/etc/shadow' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Write ---

    it('#14 Write src/app.ts — path allow', () => {

      const result = run('Write', { file_path: 'src/app.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#15 Write README.md — noMatch', () => {

      const result = run('Write', { file_path: 'README.md' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Grep: multi-property guard ---

    it('#16 Grep TODO in src — allow (AND logic)', () => {

      const result = run('Grep', { pattern: 'TODO', path: 'src/app.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#17 Grep password in src — scopedDeny', () => {

      const result = run('Grep', { pattern: 'password', path: 'src/app.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#18 Grep TODO in tests — path noMatch', () => {

      const result = run('Grep', { pattern: 'TODO', path: 'tests/app.ts' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Glob ---

    it('#19 Glob src — directory path allow', () => {

      const result = run('Glob', { pattern: '**/*.ts', path: 'src' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    // --- WebFetch ---

    it('#20 WebFetch https://example.com — allow', () => {

      const result = run('WebFetch', { url: 'https://example.com' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#21 WebFetch https://evil.com — scopedDeny', () => {

      const result = run('WebFetch', { url: 'https://evil.com' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Task ---

    it('#22 Task Explore — allow', () => {

      const result = run('Task', { subagent_type: 'Explore' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#23 Task general-purpose — noMatch', () => {

      const result = run('Task', { subagent_type: 'general-purpose' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- ReadMcpResource ---

    it('#24 ReadMcpResource my-server resource://docs — allow', () => {

      const result = run('ReadMcpResource', { server: 'my-server', uri: 'resource://docs' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
    })

    it('#25 ReadMcpResource my-server resource://secret/data — scopedDeny', () => {

      const result = run('ReadMcpResource', { server: 'my-server', uri: 'resource://secret/data' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    it('#26 ReadMcpResource unknown server — noMatch', () => {

      const result = run('ReadMcpResource', { server: 'unknown', uri: 'resource://docs' })
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })

    // --- Unknown tool ---

    it('#27 Unknown tool — not in config', () => {

      const result = run('Unknown', {})
      expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    })
  })
})
