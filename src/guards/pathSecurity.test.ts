import { describe, expect, it } from 'vitest'
import { EditToolGuard } from './edit'
import { GlobToolGuard } from './glob'
import { GrepToolGuard } from './grep'
import { LSToolGuard } from './ls'
import { MultiEditToolGuard } from './multiEdit'
import { NotebookEditToolGuard } from './notebookEdit'
import { NotebookReadToolGuard } from './notebookRead'
import { ReadToolGuard } from './read'
import { WriteToolGuard } from './write'



describe('path security (end-to-end through ToolGuardFactory)', () => {

  describe('with ** (wildcard allow)', () => {

    const guard = ReadToolGuard({ allow: ['**'] })

    it('allows internal path', () => {

      expect(guard({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      expect(guard({ file_path: '../etc/passwd' }).allowed).toBe(false)
    })

    it('blocks absolute path', () => {

      expect(guard({ file_path: '/etc/passwd' }).allowed).toBe(false)
    })

    it('blocks deep traversal', () => {

      expect(guard({ file_path: 'src/../../../etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    const guard = ReadToolGuard({ allow: ['src/**'] })

    it('allows path within subdirectory', () => {

      expect(guard({ file_path: 'src/app.ts' })).toEqual({ allowed: true })
    })

    it('blocks path outside subdirectory', () => {

      expect(guard({ file_path: 'README.md' }).allowed).toBe(false)
    })

    it('blocks traversal from subdirectory', () => {

      expect(guard({ file_path: 'src/../.env' }).allowed).toBe(false)
    })
  })

  describe('traversal attacks on all path-based guards', () => {

    const traversalPaths = [
      '../etc/passwd',
      '/etc/shadow',
      'src/../../../etc/passwd',
    ]

    describe('WriteToolGuard', () => {

      const guard = WriteToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ file_path: path }).allowed).toBe(false)
        })
    })

    describe('EditToolGuard', () => {

      const guard = EditToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ file_path: path }).allowed).toBe(false)
        })
    })

    describe('MultiEditToolGuard', () => {

      const guard = MultiEditToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ file_path: path }).allowed).toBe(false)
        })
    })

    describe('NotebookEditToolGuard', () => {

      const guard = NotebookEditToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ notebook_path: path }).allowed).toBe(false)
        })
    })

    describe('NotebookReadToolGuard', () => {

      const guard = NotebookReadToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ notebook_path: path }).allowed).toBe(false)
        })
    })

    describe('GlobToolGuard', () => {

      const guard = GlobToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ path }).allowed).toBe(false)
        })
    })

    describe('GrepToolGuard', () => {

      const guard = GrepToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ path }).allowed).toBe(false)
        })
    })

    describe('LSToolGuard', () => {

      const guard = LSToolGuard({ allow: ['**'] })

      for (const path of traversalPaths)
        it(`blocks ${path}`, () => {

          expect(guard({ path }).allowed).toBe(false)
        })
    })
  })

  describe('unicode and null bytes (TEST-H10)', () => {

    const guard = ReadToolGuard({ allow: ['**'] })

    it('rejects null byte in path', () => {

      expect(guard({ file_path: 'src/app\0.ts' }).allowed).toBe(false)
    })

    it('rejects unicode path separator', () => {

      expect(guard({ file_path: 'src\u2215app.ts' }).allowed).toBe(false)
    })

    it('rejects non-ASCII characters in path', () => {

      expect(guard({ file_path: 'src/\u00e0pp.ts' }).allowed).toBe(false)
    })
  })
})
