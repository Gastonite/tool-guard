import { describe, expect, it } from 'vitest'
import { ReadToolGuard } from './read'



describe('ReadToolGuard', () => {

  it('extracts file_path from input', () => {

    const policy = ReadToolGuard({ allow: ['src/*'] })

    expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
    expect(policy({ file_path: 'other.ts' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows files within project', () => {

      const policy = ReadToolGuard({ allow: '**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'README.md' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = ReadToolGuard({ allow: '**' })

      expect(policy({ file_path: '../etc/passwd' }).allowed).toBe(false)
      expect(policy({ file_path: 'src/../../../etc/passwd' }).allowed).toBe(false)
    })

    it('blocks absolute paths', () => {

      const policy = ReadToolGuard({ allow: '**' })

      expect(policy({ file_path: '/etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows files within subdirectory', () => {

      const policy = ReadToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
      expect(policy({ file_path: 'src/sub/file.ts' })).toEqual({ allowed: true })
    })

    it('blocks files outside subdirectory', () => {

      const policy = ReadToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'README.md' }).allowed).toBe(false)
      expect(policy({ file_path: 'docs/guide.md' }).allowed).toBe(false)
    })

    it('blocks traversal from subdirectory', () => {

      const policy = ReadToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/../.env' }).allowed).toBe(false)
      expect(policy({ file_path: 'src/../../etc/passwd' }).allowed).toBe(false)
    })
  })
})
