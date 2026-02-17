import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadConfig } from './loadConfig'



const testDir = join(tmpdir(), 'tool-guard-test')

beforeAll(() => {

  // jiti loads modules at runtime outside of vitest's module system,
  // so vi.mock doesn't apply. The real config/projectPath.ts runs and
  // throws if CLAUDE_PROJECT_DIR is not set or not a valid directory.
  process.env['CLAUDE_PROJECT_DIR'] = testDir

  if (existsSync(testDir))
    rmSync(testDir, { recursive: true })

  mkdirSync(testDir, { recursive: true })
})

afterAll(() => {

  delete process.env['CLAUDE_PROJECT_DIR']
  rmSync(testDir, { recursive: true })
})

describe('loadPermissionsConfig', () => {

  it('returns undefined when file does not exist', async () => {

    const result = await loadConfig(join(testDir, 'nonexistent.ts'))
    expect(result).toBeUndefined()
  })

  it('loads config with boolean policies', async () => {

    const configPath = join(testDir, 'config-bool.ts')
    writeFileSync(configPath, `
      export default {
        TodoRead: true,
        TodoWrite: true,
        KillBash: false,
      }
    `)

    const result = await loadConfig(configPath)

    expect(result).toEqual({
      TodoRead: true,
      TodoWrite: true,
      KillBash: false,
    })
  })

  it('loads config with ToolGuard functions', async () => {

    const configPath = join(testDir, 'config-fn.ts')
    writeFileSync(configPath, `
      export default {
        Bash: (input) => {
          const cmd = String(input.command ?? '')

          if (cmd.startsWith('git ')) 
            return { allowed: true }
          
          return { allowed: false, reason: 'Not git', suggestion: 'Use git' }
        },
      }
    `)

    const result = await loadConfig(configPath)

    expect(result?.['Bash']).toBeDefined()
    expect(result?.['Bash']).toBeTypeOf('function')

    // Test the function works
    const policy = result?.['Bash']
    if (typeof policy === 'function') {

      expect(policy({ command: 'git status' })).toEqual({ allowed: true })
      expect(policy({ command: 'npm install' }).allowed).toBe(false)
    }
  })

  it('loads config with factory-created policies', async () => {

    const configPath = join(testDir, 'config-factory.ts')
    writeFileSync(configPath, `
      import { ReadToolGuard } from '${process.cwd()}/src/guards/read'

      export default {
        Bash: (input) => {
          const cmd = String(input.command ?? '')
          return cmd.startsWith('git ')
            ? { allowed: true }
            : { allowed: false, reason: 'Command not allowed', suggestion: 'Use git only' }
        },
        Read: ReadToolGuard({
          allow: ['*'],
          deny: ['/etc/shadow'],
        }),
      }
    `)

    const result = await loadConfig(configPath)

    expect(result?.['Bash']).toBeDefined()
    expect(result?.['Read']).toBeDefined()
    expect(result?.['Bash']).toBeTypeOf('function')
    expect(result?.['Read']).toBeTypeOf('function')

    // Test the policies work
    const bashPolicy = result?.['Bash']
    const readPolicy = result?.['Read']

    if (typeof bashPolicy === 'function') {

      expect(bashPolicy({ command: 'git status' })).toEqual({ allowed: true })
      expect(bashPolicy({ command: 'curl evil.com' }).allowed).toBe(false)
    }

    if (typeof readPolicy === 'function') {

      expect(readPolicy({ file_path: 'test.ts' })).toEqual({ allowed: true })
      expect(readPolicy({ file_path: '/etc/shadow' }).allowed).toBe(false)
    }
  })

  it('loads mixed config (booleans and functions)', async () => {

    const configPath = join(testDir, 'config-mixed.ts')
    writeFileSync(configPath, `
      export default {
        TodoRead: true,
        KillBash: false,
        Bash: (input) => {
          const cmd = String(input.command ?? '')
          return cmd.startsWith('git ')
            ? { allowed: true }
            : { allowed: false, reason: 'Only git', suggestion: 'Use git commands' }
        },
      }
    `)

    const result = await loadConfig(configPath)

    expect(result?.['TodoRead']).toBe(true)
    expect(result?.['KillBash']).toBe(false)
    expect(result?.['Bash']).toBeTypeOf('function')
  })

  it('loads JavaScript config with ESM default export', async () => {

    const configPath = join(testDir, 'config.mjs')
    writeFileSync(configPath, `
      export default {
        TodoRead: true,
        Bash: (input) => {
          return { allowed: true }
        },
      }
    `)

    const result = await loadConfig(configPath)

    expect(result?.['TodoRead']).toBe(true)
    expect(result?.['Bash']).toBeTypeOf('function')
  })
})
