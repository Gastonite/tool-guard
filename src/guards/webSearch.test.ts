import { describe, expect, it } from 'vitest'
import { WebSearchToolGuard } from './webSearch'



describe('WebSearchToolGuard', () => {

  it('extracts query from input', () => {

    const policy = WebSearchToolGuard({ allow: '*' })

    expect(policy({ query: 'test query' })).toEqual({ allowed: true })
  })
})
