import { describe, expect, it } from 'vitest'
import { MultiEditToolGuard } from './multiEdit'



describe('MultiEditToolGuard', () => {

  it('extracts file_path from input', () => {

    const policy = MultiEditToolGuard({ allow: ['src/*'] })

    expect(policy({ file_path: 'src/index.ts' })).toEqual({ allowed: true })
    expect(policy({ file_path: 'other.ts' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows files within project', () => {

      const policy = MultiEditToolGuard({ allow: '**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = MultiEditToolGuard({ allow: '**' })

      expect(policy({ file_path: '../etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows files within subdirectory', () => {

      const policy = MultiEditToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = MultiEditToolGuard({ allow: 'src/**' })

      expect(policy({ file_path: 'src/../.env' }).allowed).toBe(false)
    })
  })
})
