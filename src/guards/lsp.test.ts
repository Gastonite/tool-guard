import { describe, expect, it } from 'vitest'
import { LSPToolGuard } from './lsp'



describe('LSPToolGuard', () => {

  it('extracts operation and filePath from input', () => {

    const policy = LSPToolGuard({
      allow: [{
        operation: ['goToDefinition', 'hover'],
        filePath: ['src/*'],
      }],
    })

    expect(policy({ operation: 'goToDefinition', filePath: 'src/app.ts' })).toEqual({ allowed: true })
    expect(policy({ operation: 'rename', filePath: 'src/app.ts' }).allowed).toBe(false)
    expect(policy({ operation: 'goToDefinition', filePath: 'other/app.ts' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = LSPToolGuard({
      allow: [{
        operation: ['*'],
        filePath: ['**'],
      }],
      deny: [{
        operation: ['rename'],
      }],
    })

    expect(policy({ operation: 'goToDefinition', filePath: 'src/app.ts' })).toEqual({ allowed: true })
    expect(policy({ operation: 'rename', filePath: 'src/app.ts' }).allowed).toBe(false)
  })

  it('noMatch — denies when values do not match any allow pattern', () => {

    const guard = LSPToolGuard({
      allow: [{
        operation: ['goToDefinition'],
        filePath: ['src/*'],
      }],
    })
    const result = guard({ operation: 'rename', filePath: 'src/app.ts' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when values match a global deny', () => {

    const guard = LSPToolGuard({
      deny: [{
        operation: ['rename'],
      }],
    })
    const result = guard({ operation: 'rename', filePath: 'src/app.ts' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when properties are missing', () => {

    const guard = LSPToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
