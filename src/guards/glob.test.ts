import { describe, expect, it } from 'vitest'
import { GlobToolGuard } from './glob'



describe('GlobToolGuard', () => {

  it('extracts pattern and path from input', () => {

    const policy = GlobToolGuard({
      allow: {
        pattern: ['*.ts'],
        path: ['src/*'],
      },
    })

    expect(policy({ pattern: '*.ts', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: '*.ts', path: 'other/foo' }).allowed).toBe(false)
  })

  describe('with ** for path (built-in security)', () => {

    it('allows paths within project', () => {

      const policy = GlobToolGuard({
        allow: {
          pattern: '*',
          path: '**',
        },
      })

      expect(policy({ pattern: '*.ts', path: 'src' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = GlobToolGuard({
        allow: {
          pattern: '*',
          path: '**',
        },
      })

      expect(policy({ pattern: '*.ts', path: '../' }).allowed).toBe(false)
      expect(policy({ pattern: '*.ts', path: '/etc' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob for path', () => {

    it('allows paths within subdirectory', () => {

      const policy = GlobToolGuard({
        allow: {
          pattern: '*',
          path: 'src/**',
        },
      })

      expect(policy({ pattern: '*.ts', path: 'src/components' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = GlobToolGuard({
        allow: {
          pattern: '*',
          path: 'src/**',
        },
      })

      expect(policy({ pattern: '*.ts', path: 'src/../node_modules' }).allowed).toBe(false)
    })
  })
})
