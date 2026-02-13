import { describe, expect, it } from 'vitest'
import { WebFetchToolGuard } from './webFetch'



describe('WebFetchToolGuard', () => {

  it('extracts url from input', () => {

    const policy = WebFetchToolGuard({ allow: ['https://example.com/*'] })

    expect(policy({ url: 'https://example.com/api' })).toEqual({ allowed: true })
    expect(policy({ url: 'https://evil.com/api' }).allowed).toBe(false)
  })
})
