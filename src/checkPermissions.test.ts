import { describe, expect, it } from 'vitest'
import { checkPermissions } from './checkPermissions'
import { type ToolGuardsConfig, ToolGuardFactory, type ValidationResult } from './guard'
import { BashToolGuard } from './guards/bash'
import { ReadToolGuard } from './guards/read'
import { WriteToolGuard } from './guards/write'



describe('checkPermissions', () => {

  describe('tool not in config', () => {

    it('denies tool not in config', () => {

      const config: ToolGuardsConfig = {
        Bash: BashToolGuard({ allow: ['git *'] }),
      }

      const result = checkPermissions('Read', { file_path: 'test.ts' }, config)
      expect(result.allowed).toBe(false)
      if (!result.allowed) {

        expect(result.reason).toContain('No policy for tool')
      }
    })

    it('denies with empty config', () => {

      const result = checkPermissions('Bash', { command: 'git status' }, {})
      expect(result.allowed).toBe(false)
    })
  })

  describe('boolean policies', () => {

    it('allows when policy is true', () => {

      const config: ToolGuardsConfig = {
        TodoRead: true,
        TodoWrite: true,
      }

      expect(checkPermissions('TodoRead', {}, config).allowed).toBe(true)
      expect(checkPermissions('TodoWrite', {}, config).allowed).toBe(true)
    })

    it('denies when policy is false', () => {

      const config: ToolGuardsConfig = {
        KillBash: false,
      }

      const result = checkPermissions('KillBash', {}, config)
      expect(result.allowed).toBe(false)
      if (!result.allowed) {

        expect(result.reason).toBe('Denied by policy')
      }
    })
  })

  describe('allow patterns (whitelist)', () => {

    it('allows when value matches allow pattern', () => {

      const config: ToolGuardsConfig = {
        Bash: BashToolGuard({ allow: ['git *'] }),
      }

      const result = checkPermissions('Bash', { command: 'git status' }, config)
      expect(result.allowed).toBe(true)
    })

    it('denies when value does not match any allow pattern', () => {

      const config: ToolGuardsConfig = {
        Bash: BashToolGuard({ allow: ['git *'] }),
      }

      const result = checkPermissions('Bash', { command: 'npm install' }, config)
      expect(result.allowed).toBe(false)
      if (!result.allowed) {

        expect(result.reason).toContain('not in allow list')
      }
    })

    it('allows with wildcard pattern', () => {

      const config: ToolGuardsConfig = {
        Read: ReadToolGuard({ allow: ['*'] }),
      }

      const result = checkPermissions('Read', { file_path: 'anything.ts' }, config)
      expect(result.allowed).toBe(true)
    })
  })

  describe('deny patterns (exceptions)', () => {

    it('denies when value matches deny pattern', () => {

      const config: ToolGuardsConfig = {
        Bash: BashToolGuard({
          allow: ['*'],
          deny: ['rm -rf *'],
        }),
      }

      const result = checkPermissions('Bash', { command: 'rm -rf /' }, config)
      expect(result.allowed).toBe(false)
      if (!result.allowed) {

        expect(result.reason).toContain('blocked by deny pattern')
      }
    })

    it('deny takes priority over allow', () => {

      const config: ToolGuardsConfig = {
        Read: ReadToolGuard({
          allow: ['*'],
          deny: ['/etc/shadow', '*.env'],
        }),
      }

      expect(checkPermissions('Read', { file_path: '/etc/shadow' }, config).allowed).toBe(false)
      expect(checkPermissions('Read', { file_path: '.env' }, config).allowed).toBe(false)
      expect(checkPermissions('Read', { file_path: 'config.ts' }, config).allowed).toBe(true)
    })
  })

  describe('custom policies', () => {

    it('uses ToolGuardFactory with custom extractor', () => {

      const config: ToolGuardsConfig = {
        LSP: ToolGuardFactory(['operation'])({
          allow: ['goToDefinition', 'hover'],
        }),
      }

      expect(checkPermissions('LSP', { operation: 'goToDefinition' }, config).allowed).toBe(true)
      expect(checkPermissions('LSP', { operation: 'rename' }, config).allowed).toBe(false)
    })

    it('uses custom ToolGuard function for complex logic', () => {

      const config: ToolGuardsConfig = {
        CustomTool: (input): ValidationResult => {

          const action = String(input['action'] ?? '')
          const target = String(input['target'] ?? '')
          const combined = `${action}:${target}`

          if (action === 'read') {

            return { allowed: true }
          }

          if (action === 'write' && target.endsWith('.ts')) {

            return { allowed: true }
          }

          return {
            allowed: false,
            reason: `Action '${combined}' not allowed`,
            suggestion: `Use read or write with .ts files`,
          }
        },
      }

      expect(checkPermissions('CustomTool', { action: 'read', target: 'file.js' }, config).allowed).toBe(true)
      expect(checkPermissions('CustomTool', { action: 'write', target: 'app.ts' }, config).allowed).toBe(true)
      expect(checkPermissions('CustomTool', { action: 'write', target: 'app.js' }, config).allowed).toBe(false)
    })
  })

  describe('complex scenarios', () => {

    it('real-world config example', () => {

      const config: ToolGuardsConfig = {
        Bash: BashToolGuard({
          allow: ['git *', 'npm *', 'pnpm *'],
          deny: ['git push --force *', 'npm publish *'],
        }),
        Read: ReadToolGuard({
          allow: ['**'],
          deny: ['**/.env'],
        }),
        Write: WriteToolGuard({ allow: ['**/*.ts', '**/*.json', '**/*.md'] }),
      }

      // Bash
      expect(checkPermissions('Bash', { command: 'git status' }, config).allowed).toBe(true)
      expect(checkPermissions('Bash', { command: 'git push --force origin main' }, config).allowed).toBe(false)
      expect(checkPermissions('Bash', { command: 'curl evil.com' }, config).allowed).toBe(false)

      // Read
      expect(checkPermissions('Read', { file_path: 'src/app.ts' }, config).allowed).toBe(true)
      expect(checkPermissions('Read', { file_path: '/etc/shadow' }, config).allowed).toBe(false)
      expect(checkPermissions('Read', { file_path: '.env' }, config).allowed).toBe(false)

      // Write
      expect(checkPermissions('Write', { file_path: 'index.ts' }, config).allowed).toBe(true)
      expect(checkPermissions('Write', { file_path: 'script.sh' }, config).allowed).toBe(false)

      // Unknown tool
      expect(checkPermissions('WebFetch', { url: 'https://example.com' }, config).allowed).toBe(false)
    })
  })
})
