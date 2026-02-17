import { describe, expect, it } from 'vitest'
import { EditToolGuard } from './edit'



describe('EditToolGuard', () => {

  it('extracts file_path from input', () => {

    const policy = EditToolGuard({ allow: ['src/*'] })

    expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
    expect(policy({ file_path: 'other.ts' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = EditToolGuard({ allow: ['src/*'], deny: ['src/secret*'] })

    expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
    expect(policy({ file_path: 'src/secret.ts' }).allowed).toBe(false)
  })

  it('noMatch — denies when file_path does not match any allow pattern', () => {

    const guard = EditToolGuard({ allow: ['src/*'] })
    const result = guard({ file_path: 'other/secret.ts' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when file_path matches a global deny', () => {

    const guard = EditToolGuard({ deny: ['*.env'] })
    const result = guard({ file_path: '.env' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when file_path is missing', () => {

    const guard = EditToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
