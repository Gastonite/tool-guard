import { describe, expect, it } from 'vitest'
import { NotebookEditToolGuard } from './notebookEdit'



describe('NotebookEditToolGuard', () => {

  it('extracts notebook_path from input', () => {

    const policy = NotebookEditToolGuard({ allow: ['notebooks/*'] })

    expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    expect(policy({ notebook_path: 'other/file.ipynb' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = NotebookEditToolGuard({ allow: ['**'], deny: ['secrets/**'] })

    expect(policy({ notebook_path: 'notebooks/analysis.ipynb' })).toEqual({ allowed: true })
    expect(policy({ notebook_path: 'secrets/keys.ipynb' }).allowed).toBe(false)
  })

  it('noMatch — denies when notebook_path does not match any allow pattern', () => {

    const guard = NotebookEditToolGuard({ allow: ['notebooks/*'] })
    const result = guard({ notebook_path: 'other/file.ipynb' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when notebook_path matches a global deny', () => {

    const guard = NotebookEditToolGuard({ deny: ['secrets/*'] })
    const result = guard({ notebook_path: 'secrets/keys.ipynb' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when notebook_path is missing', () => {

    const guard = NotebookEditToolGuard({ allow: ['**'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
