import { describe, expect, it } from 'vitest'
import { GlobToolGuard } from './glob'



describe('GlobToolGuard', () => {

  it('extracts pattern and path from input', () => {

    const policy = GlobToolGuard({
      allow: [{
        pattern: ['*.ts'],
        path: ['src/*'],
      }],
    })

    expect(policy({ pattern: '*.ts', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: '*.ts', path: 'other/foo' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = GlobToolGuard({
      allow: [{
        pattern: ['*'],
        path: ['**'],
      }],
      deny: [{
        path: ['vendor/**'],
      }],
    })

    expect(policy({ pattern: '*.ts', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: '*.ts', path: 'vendor/lib' }).allowed).toBe(false)
  })

  it('noMatch — denies when values do not match any allow pattern', () => {

    const guard = GlobToolGuard({
      allow: [{
        pattern: ['*.ts'],
        path: ['src/*'],
      }],
    })
    const result = guard({ pattern: '*.ts', path: 'vendor/foo' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when values match a global deny', () => {

    const guard = GlobToolGuard({
      deny: [{
        path: ['vendor/**'],
      }],
    })
    const result = guard({ pattern: '*.ts', path: 'vendor/lib' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when properties are missing', () => {

    const guard = GlobToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
