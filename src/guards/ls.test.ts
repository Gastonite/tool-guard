import { describe, expect, it } from 'vitest'
import { LSToolGuard } from './ls'



describe('LSToolGuard', () => {

  it('extracts path from input', () => {

    const policy = LSToolGuard({ allow: ['src/*'] })

    expect(policy({ path: 'src/components' })).toEqual({ allowed: true })
    expect(policy({ path: 'node_modules/pkg' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows paths within project', () => {

      const policy = LSToolGuard({ allow: '**' })

      expect(policy({ path: 'src' })).toEqual({ allowed: true })
      expect(policy({ path: 'src/components' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = LSToolGuard({ allow: '**' })

      expect(policy({ path: '../' }).allowed).toBe(false)
      expect(policy({ path: '/etc' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows paths within subdirectory', () => {

      const policy = LSToolGuard({ allow: 'src/**' })

      expect(policy({ path: 'src/components' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = LSToolGuard({ allow: 'src/**' })

      expect(policy({ path: 'src/../node_modules' }).allowed).toBe(false)
    })
  })
})
