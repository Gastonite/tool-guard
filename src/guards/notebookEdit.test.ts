import { describe, expect, it } from 'vitest'
import { NotebookEditToolGuard } from './notebookEdit'



describe('NotebookEditToolGuard', () => {

  it('extracts notebook_path from input', () => {

    const policy = NotebookEditToolGuard({ allow: ['notebooks/*'] })

    expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    expect(policy({ notebook_path: 'other/file.ipynb' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows notebooks within project', () => {

      const policy = NotebookEditToolGuard({ allow: '**' })

      expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = NotebookEditToolGuard({ allow: '**' })

      expect(policy({ notebook_path: '../etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows notebooks within subdirectory', () => {

      const policy = NotebookEditToolGuard({ allow: 'notebooks/**' })

      expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = NotebookEditToolGuard({ allow: 'notebooks/**' })

      expect(policy({ notebook_path: 'notebooks/../secrets.ipynb' }).allowed).toBe(false)
    })
  })
})
