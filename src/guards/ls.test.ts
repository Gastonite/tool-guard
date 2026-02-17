import { describe, expect, it } from 'vitest'
import { LSToolGuard } from './ls'



describe('LSToolGuard', () => {

  it('extracts path from input', () => {

    const policy = LSToolGuard({ allow: ['src/*'] })

    expect(policy({ path: 'src/components' })).toEqual({ allowed: true })
    expect(policy({ path: 'node_modules/pkg' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = LSToolGuard({ allow: ['**'], deny: ['node_modules/**'] })

    expect(policy({ path: 'src/components' })).toEqual({ allowed: true })
    expect(policy({ path: 'node_modules/pkg' }).allowed).toBe(false)
  })

  it('noMatch — denies when path does not match any allow pattern', () => {

    const guard = LSToolGuard({ allow: ['src/*'] })
    const result = guard({ path: 'node_modules/pkg' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when path matches a global deny', () => {

    const guard = LSToolGuard({ deny: ['node_modules/*'] })
    const result = guard({ path: 'node_modules/pkg' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when path is missing', () => {

    const guard = LSToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
