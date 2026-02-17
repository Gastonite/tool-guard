import { describe, expect, it } from 'vitest'
import { GrepToolGuard } from './grep'



describe('GrepToolGuard', () => {

  it('extracts pattern and path from input', () => {

    const policy = GrepToolGuard({
      allow: [{
        pattern: ['*'],
        path: ['src/*'],
      }],
    })

    expect(policy({ pattern: 'TODO', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: 'TODO', path: 'vendor/foo' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = GrepToolGuard({
      allow: [{
        pattern: ['*'],
        path: ['**'],
      }],
      deny: [{
        path: ['vendor/**'],
      }],
    })

    expect(policy({ pattern: 'TODO', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: 'TODO', path: 'vendor/lib' }).allowed).toBe(false)
  })

  it('noMatch — denies when values do not match any allow pattern', () => {

    const guard = GrepToolGuard({
      allow: [{
        pattern: ['*'],
        path: ['src/*'],
      }],
    })
    const result = guard({ pattern: 'TODO', path: 'vendor/foo' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when values match a global deny', () => {

    const guard = GrepToolGuard({
      deny: [{
        path: ['vendor/**'],
      }],
    })
    const result = guard({ pattern: 'TODO', path: 'vendor/lib' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when properties are missing', () => {

    const guard = GrepToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
