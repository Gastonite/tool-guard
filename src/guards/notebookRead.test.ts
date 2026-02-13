import { describe, expect, it } from 'vitest'
import { NotebookReadToolGuard } from './notebookRead'



describe('NotebookReadToolGuard', () => {

  it('extracts notebook_path from input', () => {

    const policy = NotebookReadToolGuard({ allow: ['notebooks/*'] })

    expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    expect(policy({ notebook_path: 'other/file.ipynb' }).allowed).toBe(false)
  })

  describe('with ** (built-in security)', () => {

    it('allows notebooks within project', () => {

      const policy = NotebookReadToolGuard({ allow: '**' })

      expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    })

    it('blocks path traversal', () => {

      const policy = NotebookReadToolGuard({ allow: '**' })

      expect(policy({ notebook_path: '../etc/passwd' }).allowed).toBe(false)
    })
  })

  describe('with prefix glob', () => {

    it('allows notebooks within subdirectory', () => {

      const policy = NotebookReadToolGuard({ allow: 'notebooks/**' })

      expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    })

    it('blocks traversal from subdirectory', () => {

      const policy = NotebookReadToolGuard({ allow: 'notebooks/**' })

      expect(policy({ notebook_path: 'notebooks/../secrets.ipynb' }).allowed).toBe(false)
    })
  })
})
