import { describe, expect, it } from 'vitest'
import { GrepToolGuard } from './grep'



describe('GrepToolGuard', () => {

  it('extracts pattern and path from input', () => {

    const policy = GrepToolGuard({
      allow: {
        pattern: ['*'],
        path: ['src/*'],
      },
    })

    expect(policy({ pattern: 'TODO', path: 'src/foo' })).toEqual({ allowed: true })
    expect(policy({ pattern: 'TODO', path: 'vendor/foo' }).allowed).toBe(false)
  })

  describe('with ** for path (built-in security)', () => {

    it('allows paths within project', () => {

      const policy = GrepToolGuard({
        allow: {
          pattern: '*',
          path: '**',
        },
      })

      expect(policy({ pattern: 'TODO', path: 'src' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = GrepToolGuard({
        allow: {
          pattern: '*',
          path: '**',
        },
      })

      expect(policy({ pattern: 'TODO', path: '../' }).allowed).toBe(false)
      expect(policy({ pattern: 'TODO', path: '/etc' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob for path', () => {

    it('allows paths within subdirectory', () => {

      const policy = GrepToolGuard({
        allow: {
          pattern: '*',
          path: 'src/**',
        },
      })

      expect(policy({ pattern: 'TODO', path: 'src/components' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = GrepToolGuard({
        allow: {
          pattern: '*',
          path: 'src/**',
        },
      })

      expect(policy({ pattern: 'TODO', path: 'src/../node_modules' }).allowed).toBe(false)
    })
  })
})
