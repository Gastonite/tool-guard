import { describe, expect, it } from 'vitest'
import { WebSearchToolGuard } from './webSearch'



describe('WebSearchToolGuard', () => {

  it('extracts query from input', () => {

    const policy = WebSearchToolGuard({ allow: ['*'] })

    expect(policy({ query: 'test query' })).toEqual({ allowed: true })
  })

  it('rejects non-matching query', () => {

    const policy = WebSearchToolGuard({ allow: ['typescript*'] })

    expect(policy({ query: 'typescript tutorial' })).toEqual({ allowed: true })
    expect(policy({ query: 'python tutorial' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = WebSearchToolGuard({ allow: ['*'], deny: ['secret*'] })

    expect(policy({ query: 'test query' })).toEqual({ allowed: true })
    expect(policy({ query: 'secret query' }).allowed).toBe(false)
  })

  it('noMatch — denies when query does not match any allow pattern', () => {

    const guard = WebSearchToolGuard({ allow: ['typescript*'] })
    const result = guard({ query: 'python tutorial' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when query matches a global deny', () => {

    const guard = WebSearchToolGuard({ deny: ['secret*'] })
    const result = guard({ query: 'secret query' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when query is missing', () => {

    const guard = WebSearchToolGuard({ allow: ['test*'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
