import { describe, expect, it } from 'vitest'
import { LSPToolGuard } from './lsp'



describe('LSPToolGuard', () => {

  it('extracts operation and filePath from input', () => {

    const policy = LSPToolGuard({
      allow: {
        operation: ['goToDefinition', 'hover'],
        filePath: ['src/*'],
      },
    })

    expect(policy({ operation: 'goToDefinition', filePath: 'src/app.ts' })).toEqual({ allowed: true })
    expect(policy({ operation: 'rename', filePath: 'src/app.ts' }).allowed).toBe(false)
    expect(policy({ operation: 'goToDefinition', filePath: 'other/app.ts' }).allowed).toBe(false)
  })
})
