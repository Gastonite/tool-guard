import { describe, expect, it } from 'vitest'
import { EditToolGuard } from './edit'



describe('EditToolGuard', () => {

  it('extracts file_path from input', () => {

    const policy = EditToolGuard({ allow: ['src/*'] })

    expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
    expect(policy({ file_path: 'other.ts' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows files within project', () => {

      const policy = EditToolGuard({ allow: '**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = EditToolGuard({ allow: '**' })

      expect(policy({ file_path: '../etc/passwd' }).allowed).toBe(false)
    })

    it('blocks absolute paths', () => {

      const policy = EditToolGuard({ allow: '**' })

      expect(policy({ file_path: '/etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows files within subdirectory', () => {

      const policy = EditToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks files outside subdirectory', () => {

      const policy = EditToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'README.md' }).allowed).toBe(false)
    })

    it('blocks traversal from subdirectory', () => {

      const policy = EditToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/../.env' }).allowed).toBe(false)
    })
  })
})
